import { storage } from "./storage";
import type { Account, Asset, Debt, InsertAccount } from "@shared/schema";
import {
  emergencyGoalAmount,
  emergencyLast4,
  extractLast4,
  formatBalance,
  isBanksyncConfigured,
  listAllAccounts,
  type BanksyncAccount,
} from "./banksync";

export type BanksyncSyncUpdate = {
  kind: "account" | "debt" | "asset";
  id: string;
  name: string;
  last4: string | null;
  previousBalance: string;
  currentBalance: string;
  created?: boolean;
};

export type BanksyncSyncResult = {
  fetched: number;
  updated: number;
  created: number;
  unmatched: Array<{
    name: string;
    institution: string | null;
    last4: string | null;
    accountType: string;
    balance: number;
  }>;
  updates: BanksyncSyncUpdate[];
  emergency: {
    last4: string;
    goal: number;
    balance: number | null;
    met: boolean;
    accountId: string | null;
    accountName: string | null;
  };
  notes: string[];
};

let timer: ReturnType<typeof setInterval> | null = null;
let inFlight = false;
let lastSyncAt: Date | null = null;
let lastSyncResult: BanksyncSyncResult | null = null;

function last4OfLocalAccount(account: Account): string | null {
  return extractLast4(account.accountNumber);
}

function findAccountByLast4(accounts: Account[], last4: string): Account | undefined {
  return accounts.find((a) => last4OfLocalAccount(a) === last4);
}

function normalizeInstitution(name: string | null | undefined): string {
  const n = (name ?? "").toLowerCase();
  if (n.includes("usaa")) return "USAA";
  if (n.includes("chime")) return "Chime";
  if (n.includes("greenwood")) return "Greenwood";
  if (n.includes("navy") || n.includes("nfcu")) return "Navy Federal";
  if (n.includes("schwab")) return "Charles Schwab";
  return name?.trim() || "Unknown";
}

function isLiability(remote: BanksyncAccount): boolean {
  const t = remote.accountType.toLowerCase();
  return (
    t.includes("credit") ||
    t.includes("card") ||
    t.includes("loan") ||
    t.includes("liability") ||
    t.includes("mortgage")
  );
}

function isRetirementRemote(remote: BanksyncAccount): boolean {
  const blob = `${remote.accountName} ${remote.accountType}`.toLowerCase();
  return /roth|ira|401|retir|brokerage|investment/.test(blob);
}

function matchDebt(debts: Debt[], remote: BanksyncAccount): Debt | undefined {
  const name = remote.accountName.toLowerCase();
  const institution = normalizeInstitution(remote.bankName).toLowerCase();

  // NFCU / Navy Federal auto loan
  if (
    institution.includes("navy") ||
    /vehicle|auto|car loan|lexus/i.test(remote.accountName)
  ) {
    if (/loan|vehicle|auto/.test(remote.accountType.toLowerCase() + " " + name)) {
      const auto = debts.find(
        (d) =>
          d.debtType === "auto_loan" &&
          (/navy|nfcu/i.test(d.creditor) || /navy|nfcu|lexus|auto/i.test(d.name)),
      );
      if (auto) return auto;
    }
  }

  const byCreditor = (needle: RegExp) =>
    debts.filter((d) => needle.test(d.creditor) && d.debtType === "credit_card");

  if (name.includes("american express") || name.includes("amex")) {
    const pool = byCreditor(/usaa/i);
    return (
      pool.find((d) => /amex|american express/i.test(d.name) && d.owner === "Kevin") ??
      pool.find((d) => /amex|american express/i.test(d.name))
    );
  }

  if (name.includes("visa") && institution.includes("usaa")) {
    const pool = byCreditor(/usaa/i);
    return (
      pool.find((d) => /visa/i.test(d.name) && d.owner === "Kevin" && !d.isPaidOff) ??
      pool.find((d) => /visa/i.test(d.name) && d.owner === "Kevin") ??
      pool.find((d) => /visa/i.test(d.name))
    );
  }

  if (name.includes("visa") && institution.includes("navy")) {
    const pool = byCreditor(/navy|nfcu/i);
    return (
      pool.find((d) => /visa/i.test(d.name) && d.owner === "Kevin" && !d.isPaidOff) ??
      pool.find((d) => /visa/i.test(d.name) && !d.isPaidOff) ??
      pool.find((d) => /visa/i.test(d.name))
    );
  }

  return undefined;
}

/** Prefer Kevin's Schwab Roth asset ("Roth IRA - SC"); fall back to name/owner heuristics. */
function matchRetirementAsset(assets: Asset[], remote: BanksyncAccount): Asset | undefined {
  const name = remote.accountName.toLowerCase();
  const institution = normalizeInstitution(remote.bankName).toLowerCase();
  const retirement = assets.filter((a) => a.assetType === "retirement");

  if (institution.includes("schwab") || /schwab|roth|ira/i.test(name)) {
    return (
      retirement.find((a) => /roth.*sc|sc.*roth|schwab/i.test(a.name) && a.owner === "Kevin") ??
      retirement.find((a) => /roth.*sc|\bsc\b|schwab/i.test(a.name)) ??
      retirement.find((a) => /roth/i.test(a.name) && a.owner === "Kevin")
    );
  }

  return undefined;
}

function findAccountByInstitutionAndHints(
  accounts: Account[],
  remote: BanksyncAccount,
): Account | undefined {
  const institution = normalizeInstitution(remote.bankName);
  const remoteType = remote.accountType.toLowerCase();
  const remoteName = remote.accountName.toLowerCase();

  const sameInstitution = accounts.filter(
    (a) => normalizeInstitution(a.institution).toLowerCase() === institution.toLowerCase(),
  );

  if (/emergency/i.test(remoteName)) {
    return accounts.find((a) => /emergency/i.test(a.name));
  }

  // Chime: seeded "Chime Prepaid Visa" often has empty last4
  if (institution === "Chime") {
    if (remoteType.includes("saving")) {
      return (
        sameInstitution.find((a) => a.accountType === "savings") ??
        accounts.find((a) => /chime/i.test(a.name) && a.accountType === "savings")
      );
    }
    return (
      sameInstitution.find((a) => a.accountType === "checking" || /prepaid|chime/i.test(a.name)) ??
      accounts.find((a) => /chime/i.test(a.name))
    );
  }

  // Greenwood traveling fund
  if (institution === "Greenwood") {
    return (
      sameInstitution[0] ??
      accounts.find((a) => /greenwood/i.test(a.name) || /greenwood/i.test(a.institution))
    );
  }

  // NFCU checking/savings (not loans — those go to debts)
  if (institution === "Navy Federal") {
    if (remoteType.includes("saving")) {
      return sameInstitution.find((a) => a.accountType === "savings");
    }
    if (remoteType.includes("check")) {
      return sameInstitution.find((a) => a.accountType === "checking");
    }
  }

  // Schwab / investment already created under USAA earlier — prefer last4, else name
  if (institution === "Charles Schwab" || isRetirementRemote(remote)) {
    return (
      accounts.find((a) => /roth|schwab/i.test(a.name) && a.accountType === "investment") ??
      sameInstitution.find((a) => a.accountType === "investment")
    );
  }

  return undefined;
}

function accountDefaultsForRemote(remote: BanksyncAccount): InsertAccount {
  const last4 = extractLast4(remote.accountNumber);
  const name = remote.accountName;
  const lower = name.toLowerCase();
  const type = remote.accountType.toLowerCase();
  const institution = normalizeInstitution(remote.bankName);

  let accountType = "checking";
  if (type.includes("saving") || lower.includes("emergency") || lower.includes("youth")) {
    accountType = "savings";
  } else if (
    type.includes("invest") ||
    type.includes("brokerage") ||
    type.includes("retirement") ||
    /roth|ira|401/.test(lower)
  ) {
    accountType = "investment";
  }

  let owner = "Joint";
  if (lower.includes("jamie") || lower.includes("jr denny")) owner = "Jamie";
  else if (
    lower.includes("kevin") ||
    lower.startsWith("kjd") ||
    institution === "Charles Schwab" ||
    institution === "Greenwood" ||
    (institution === "Navy Federal" && !lower.includes("jamie"))
  ) {
    owner = "Kevin";
  }

  let displayName = name;
  if (/emergency/i.test(name)) displayName = "USAA Emergency Savings";
  else if (institution === "Charles Schwab" && /roth/i.test(name)) {
    displayName = "Kevin Schwab Roth IRA";
  } else if (institution === "Chime" && type.includes("check")) {
    displayName = "Chime Checking";
  } else if (institution === "Chime" && type.includes("saving")) {
    displayName = "Chime Savings";
  }

  return {
    name: displayName,
    institution,
    accountNumber: last4 ?? "",
    accountType,
    currentBalance: formatBalance(remote.balance),
    owner,
    notes: /emergency/i.test(lower)
      ? `Emergency fund — keep at least $${emergencyGoalAmount().toFixed(0)}`
      : `Synced from BankSync (${institution} · ${remote.accountType})`,
    isActive: true,
  };
}

export async function syncBanksyncBalances(): Promise<BanksyncSyncResult> {
  if (!isBanksyncConfigured()) {
    throw new Error("BANKSYNC_API_KEY is not configured");
  }

  const { banks, accounts: remoteAccounts } = await listAllAccounts();
  const localAccounts = await storage.getAccounts();
  const localDebts = await storage.getDebts();
  const localAssets = await storage.getAssets();

  const updates: BanksyncSyncUpdate[] = [];
  const unmatched: BanksyncSyncResult["unmatched"] = [];
  const notes: string[] = [
    `Banks linked: ${banks.map((b) => b.name).join(", ") || "none"}`,
  ];
  let created = 0;

  for (const remote of remoteAccounts) {
    const last4 = extractLast4(remote.accountNumber);
    const balanceStr = formatBalance(remote.balance);
    const institution = normalizeInstitution(remote.bankName);

    // --- Liabilities (credit cards + loans) → debts ---
    if (isLiability(remote)) {
      const debt = matchDebt(localDebts, remote);
      if (!debt) {
        unmatched.push({
          name: remote.accountName,
          institution,
          last4,
          accountType: remote.accountType,
          balance: remote.balance,
        });
        continue;
      }

      const previous = String(debt.currentBalance);
      const paidOff = Math.abs(remote.balance) < 0.005;
      await storage.updateDebt(debt.id, {
        currentBalance: balanceStr,
        isPaidOff: paidOff,
      });
      updates.push({
        kind: "debt",
        id: debt.id,
        name: debt.name,
        last4,
        previousBalance: previous,
        currentBalance: balanceStr,
      });
      continue;
    }

    // --- Retirement / brokerage → net-worth assets (+ optional investment account) ---
    if (isRetirementRemote(remote)) {
      const asset = matchRetirementAsset(localAssets, remote);
      if (asset) {
        const previous = String(asset.value);
        await storage.updateAsset(asset.id, { value: balanceStr });
        updates.push({
          kind: "asset",
          id: asset.id,
          name: asset.name,
          last4,
          previousBalance: previous,
          currentBalance: balanceStr,
        });
      } else {
        notes.push(
          `No matching retirement asset for "${remote.accountName}" (${institution}) — updating/creating investment account only.`,
        );
      }
    }

    // --- Deposit / investment accounts ---
    let account =
      (last4 ? findAccountByLast4(localAccounts, last4) : undefined) ??
      findAccountByInstitutionAndHints(localAccounts, remote);

    if (!account) {
      const createdAccount = await storage.createAccount(accountDefaultsForRemote(remote));
      localAccounts.push(createdAccount);
      created += 1;
      updates.push({
        kind: "account",
        id: createdAccount.id,
        name: createdAccount.name,
        last4,
        previousBalance: "0.00",
        currentBalance: balanceStr,
        created: true,
      });
      continue;
    }

    const previous = String(account.currentBalance);
    const patch: Partial<InsertAccount> = {
      currentBalance: balanceStr,
      institution: normalizeInstitution(remote.bankName) || account.institution,
    };
    if (last4 && (!account.accountNumber || extractLast4(account.accountNumber) !== last4)) {
      patch.accountNumber = last4;
    }
    if (/emergency/i.test(remote.accountName) && !/emergency/i.test(account.name)) {
      patch.name = "USAA Emergency Savings";
      patch.notes = `Emergency fund — keep at least $${emergencyGoalAmount().toFixed(0)}`;
      patch.accountType = "savings";
    }
    // Rename seeded Chime prepaid label once we have real checking
    if (
      institution === "Chime" &&
      /prepaid/i.test(account.name) &&
      remote.accountType.toLowerCase().includes("check")
    ) {
      patch.name = "Chime Checking";
    }
    if (institution === "Charles Schwab" && /roth/i.test(remote.accountName)) {
      patch.name = "Kevin Schwab Roth IRA";
      patch.accountType = "investment";
    }

    await storage.updateAccount(account.id, patch);
    updates.push({
      kind: "account",
      id: account.id,
      name: patch.name ?? account.name,
      last4,
      previousBalance: previous,
      currentBalance: balanceStr,
    });
  }

  const refreshed = await storage.getAccounts();
  const eLast4 = emergencyLast4();
  const goal = emergencyGoalAmount();
  const emergencyAccount =
    findAccountByLast4(refreshed, eLast4) ??
    refreshed.find((a) => /emergency/i.test(a.name));

  const emergencyBalance = emergencyAccount
    ? parseFloat(String(emergencyAccount.currentBalance))
    : null;

  const result: BanksyncSyncResult = {
    fetched: remoteAccounts.length,
    updated: updates.filter((u) => !u.created).length,
    created,
    unmatched,
    updates,
    emergency: {
      last4: eLast4,
      goal,
      balance: emergencyBalance,
      met: emergencyBalance != null && emergencyBalance >= goal,
      accountId: emergencyAccount?.id ?? null,
      accountName: emergencyAccount?.name ?? null,
    },
    notes,
  };

  lastSyncAt = new Date();
  lastSyncResult = result;
  return result;
}

export function getBanksyncSyncStatus() {
  return {
    configured: isBanksyncConfigured(),
    lastSyncAt: lastSyncAt?.toISOString() ?? null,
    lastResult: lastSyncResult,
    emergencyGoal: emergencyGoalAmount(),
    emergencyLast4: emergencyLast4(),
  };
}

export async function getEmergencySavingsStatus() {
  const goal = emergencyGoalAmount();
  const last4 = emergencyLast4();
  const accounts = await storage.getAccounts();
  const account =
    findAccountByLast4(accounts, last4) ??
    accounts.find((a) => /emergency/i.test(a.name)) ??
    null;

  const balance = account ? parseFloat(String(account.currentBalance)) : null;
  return {
    configured: isBanksyncConfigured(),
    last4,
    goal,
    balance,
    met: balance != null && balance >= goal,
    progressPct: balance == null ? 0 : Math.min(100, Math.round((balance / goal) * 100)),
    account,
    lastSyncAt: lastSyncAt?.toISOString() ?? null,
  };
}

export function startBanksyncAutoSync(): void {
  const minutes = Number(process.env.BANKSYNC_AUTO_SYNC_MINUTES ?? "60");
  if (!Number.isFinite(minutes) || minutes <= 0) {
    console.log("BankSync auto-sync disabled (BANKSYNC_AUTO_SYNC_MINUTES <= 0)");
    return;
  }

  if (!isBanksyncConfigured()) {
    console.log("BankSync auto-sync skipped (BANKSYNC_API_KEY not set)");
    return;
  }

  const ms = minutes * 60 * 1000;

  const run = async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      const result = await syncBanksyncBalances();
      console.log(
        `BankSync auto-sync complete: fetched=${result.fetched} updated=${result.updated} created=${result.created}`,
      );
    } catch (error) {
      console.error("BankSync auto-sync failed:", error);
    } finally {
      inFlight = false;
    }
  };

  setTimeout(() => {
    void run();
  }, 20_000);

  timer = setInterval(() => {
    void run();
  }, ms);

  console.log(`BankSync auto-sync enabled every ${minutes}m`);
}

export function stopBanksyncAutoSync(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
