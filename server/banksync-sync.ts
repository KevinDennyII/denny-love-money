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

function findAccountByLast4(
  accounts: Account[],
  last4: string,
  preferredType?: string,
): Account | undefined {
  const matches = accounts.filter((a) => last4OfLocalAccount(a) === last4);
  if (matches.length === 0) return undefined;
  if (preferredType) {
    const typed = matches.find((a) => a.accountType === preferredType);
    if (typed) return typed;
    // Never map a Chime/USAA savings last4 onto a checking row (or vice versa)
    if (preferredType === "savings" || preferredType === "checking") {
      const depositMismatch = matches.find(
        (a) => a.accountType === "checking" || a.accountType === "savings",
      );
      if (depositMismatch && depositMismatch.accountType !== preferredType) {
        return undefined;
      }
    }
  }
  return matches[0];
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

/** Charles Schwab Roth → net-worth asset "Roth IRA - HB" (never SC — SC stays static). */
function matchRetirementAsset(assets: Asset[], remote: BanksyncAccount): Asset | undefined {
  const institution = normalizeInstitution(remote.bankName).toLowerCase();
  if (!institution.includes("schwab")) return undefined;

  const retirement = assets.filter((a) => a.assetType === "retirement");
  return (
    retirement.find((a) => /roth\s*ira\s*-\s*hb/i.test(a.name)) ??
    retirement.find((a) => /roth/i.test(a.name) && /\bhb\b/i.test(a.name) && !/\bsc\b/i.test(a.name))
  );
}

function matchEmergencyCashAsset(assets: Asset[]): Asset | undefined {
  const cash = assets.filter((a) => a.assetType === "cash");
  return (
    cash.find((a) => /emergency/i.test(a.name)) ??
    cash.find((a) => /estimate of all savings/i.test(a.name))
  );
}

const BANKSYNC_LIVE_NOTE = "Live from BankSync";

/** Optional explicit last4 for Jamie's personal Chime (avoids guessing from generic remote names). */
function jamieChimeLast4(): string | null {
  const raw = process.env.BANKSYNC_JAMIE_CHIME_LAST4?.replace(/\D/g, "").slice(-4);
  return raw && raw.length === 4 ? raw : null;
}

function isJamieChimeRemote(remote: BanksyncAccount, last4: string | null): boolean {
  const lower = remote.accountName.toLowerCase();
  if (/jamie/i.test(lower)) return true;
  const configured = jamieChimeLast4();
  return Boolean(configured && last4 && configured === last4);
}

/** BankSync may label Chime/USAA savings as "savings", "saving", or just name it Savings. */
function isSavingsRemote(remote: BanksyncAccount): boolean {
  const type = remote.accountType.toLowerCase();
  const name = remote.accountName.toLowerCase();
  if (type.includes("saving")) return true;
  if (/saving|credit builder/i.test(name) && !/check|spend|prepaid/i.test(name)) return true;
  if (/emergency/i.test(name) || /youth/i.test(name)) return true;
  return false;
}

function localAccountTypeForRemote(remote: BanksyncAccount): string {
  const type = remote.accountType.toLowerCase();
  const lower = remote.accountName.toLowerCase();
  if (isSavingsRemote(remote)) return "savings";
  if (
    type.includes("invest") ||
    type.includes("brokerage") ||
    type.includes("retirement") ||
    /roth|ira|401/.test(lower)
  ) {
    return "investment";
  }
  return "checking";
}

function findAccountByInstitutionAndHints(
  accounts: Account[],
  remote: BanksyncAccount,
  claimedIds: Set<string> = new Set(),
): Account | undefined {
  const institution = normalizeInstitution(remote.bankName);
  const remoteType = remote.accountType.toLowerCase();
  const remoteName = remote.accountName.toLowerCase();
  const remoteLast4 = extractLast4(remote.accountNumber);
  const remoteIsSavings = isSavingsRemote(remote);

  const available = (list: Account[]) => list.filter((a) => !claimedIds.has(a.id));

  const sameInstitution = available(
    accounts.filter(
      (a) => normalizeInstitution(a.institution).toLowerCase() === institution.toLowerCase(),
    ),
  );

  if (/emergency/i.test(remoteName)) {
    return available(accounts).find((a) => /emergency/i.test(a.name));
  }

  // Chime: keep Checking and Savings as separate rows; also keep Jamie's personal
  // Chime apart from the family bills Chime. Prefer last4 (caller already tries that).
  // Hints only match empties or same last4, and never reuse a claimed row.
  if (institution === "Chime") {
    const chimePool = available(
      sameInstitution.length > 0
        ? sameInstitution
        : accounts.filter((a) => /chime/i.test(a.name) || /chime/i.test(a.institution)),
    );
    const compatible = chimePool.filter((a) => {
      const local4 = last4OfLocalAccount(a);
      if (!local4) return true;
      return Boolean(remoteLast4 && local4 === remoteLast4);
    });

    // Savings first — never collapse onto Checking / prepaid
    if (remoteIsSavings) {
      return (
        compatible.find((a) => a.accountType === "savings") ??
        available(accounts).find((a) => /chime/i.test(a.name) && a.accountType === "savings")
      );
    }

    // Explicit Jamie last4 → prefer a Jamie-owned / Jamie-named Chime checking row
    if (isJamieChimeRemote(remote, remoteLast4)) {
      const jamieRow =
        compatible.find((a) => a.owner === "Jamie" && a.accountType === "checking") ??
        compatible.find((a) => /jamie/i.test(a.name) && /chime/i.test(a.name) && a.accountType !== "savings");
      if (jamieRow) return jamieRow;
      // Do not fall through to family prepaid — create a new Jamie account instead
      return undefined;
    }

    // Family / bills Chime: prepaid seed or joint checking without a conflicting last4
    return (
      compatible.find((a) => /prepaid/i.test(a.name)) ??
      compatible.find((a) => a.owner !== "Jamie" && a.accountType === "checking" && !last4OfLocalAccount(a)) ??
      compatible.find((a) => a.owner !== "Jamie" && a.accountType === "checking") ??
      compatible.find((a) => a.accountType === "checking" && !last4OfLocalAccount(a))
    );
  }

  // Greenwood traveling fund
  if (institution === "Greenwood") {
    return (
      sameInstitution[0] ??
      available(accounts).find((a) => /greenwood/i.test(a.name) || /greenwood/i.test(a.institution))
    );
  }

  // NFCU checking/savings (not loans — those go to debts)
  if (institution === "Navy Federal") {
    if (remoteIsSavings || remoteType.includes("saving")) {
      return sameInstitution.find((a) => a.accountType === "savings");
    }
    if (remoteType.includes("check")) {
      return sameInstitution.find((a) => a.accountType === "checking");
    }
  }

  // Schwab / investment already created under USAA earlier — prefer last4, else name
  if (institution === "Charles Schwab" || isRetirementRemote(remote)) {
    return (
      available(accounts).find((a) => /roth|schwab/i.test(a.name) && a.accountType === "investment") ??
      sameInstitution.find((a) => a.accountType === "investment")
    );
  }

  return undefined;
}

function accountDefaultsForRemote(
  remote: BanksyncAccount,
  existingAccounts: Account[],
): InsertAccount {
  const last4 = extractLast4(remote.accountNumber);
  const name = remote.accountName;
  const lower = name.toLowerCase();
  const institution = normalizeInstitution(remote.bankName);
  const accountType = localAccountTypeForRemote(remote);
  const jamieOwned = isJamieChimeRemote(remote, last4) || lower.includes("jamie") || lower.includes("jr denny");

  const existingChimeChecking = existingAccounts.filter(
    (a) =>
      normalizeInstitution(a.institution) === "Chime" &&
      a.accountType === "checking" &&
      (a.owner !== "Jamie" || /prepaid/i.test(a.name)),
  );
  // Second Chime checking (when family already exists) → Jamie's personal spending account
  const jamieChimeChecking =
    institution === "Chime" &&
    accountType === "checking" &&
    (jamieOwned || existingChimeChecking.length >= 1);
  const jamieChimeSavings = institution === "Chime" && accountType === "savings" && jamieOwned;

  let owner = "Joint";
  if (jamieChimeChecking || jamieChimeSavings || jamieOwned) owner = "Jamie";
  else if (
    lower.includes("kevin") ||
    lower.startsWith("kjd") ||
    institution === "Greenwood" ||
    (institution === "Navy Federal" && !lower.includes("jamie"))
  ) {
    owner = "Kevin";
  }
  // Schwab Roth maps to net-worth "Roth IRA - HB" (HB = Kevin / Honey Bunches)
  if (institution === "Charles Schwab" && /roth/i.test(lower)) {
    owner = "Kevin";
  }

  let displayName = name;
  if (/emergency/i.test(name)) displayName = "USAA Emergency Savings";
  else if (institution === "Charles Schwab" && /roth/i.test(name)) {
    displayName = "Schwab Roth IRA - HB";
  } else if (institution === "Chime" && accountType === "checking") {
    displayName = jamieChimeChecking
      ? last4
        ? `Jamie Chime Checking ··${last4}`
        : "Jamie Chime Checking"
      : "Chime Checking";
  } else if (institution === "Chime" && accountType === "savings") {
    displayName = jamieChimeSavings
      ? last4
        ? `Jamie Chime Savings ··${last4}`
        : "Jamie Chime Savings"
      : "Chime Savings";
  }

  return {
    name: displayName,
    institution,
    accountNumber: last4 ?? "",
    accountType,
    monthlyAllocation: "0",
    currentBalance: formatBalance(remote.balance),
    owner,
    notes: /emergency/i.test(lower)
      ? `Emergency fund — keep at least $${emergencyGoalAmount().toFixed(0)}. ${BANKSYNC_LIVE_NOTE}`
      : `Synced from BankSync (${institution} · ${remote.accountType}). ${BANKSYNC_LIVE_NOTE}`,
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
  const claimedAccountIds = new Set<string>();

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
        const isSchwabRoth = /roth/i.test(asset.name) && /\bhb\b/i.test(asset.name);
        await storage.updateAsset(asset.id, {
          value: balanceStr,
          ...(isSchwabRoth ? { owner: "Kevin" as const } : {}),
          notes: `${BANKSYNC_LIVE_NOTE} (${institution})`,
        });
        // Keep in-memory list current for later emergency cash matching
        asset.value = balanceStr as typeof asset.value;
        if (isSchwabRoth) asset.owner = "Kevin";
        asset.notes = `${BANKSYNC_LIVE_NOTE} (${institution})`;
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
    const preferredType = localAccountTypeForRemote(remote);
    let account =
      (last4 ? findAccountByLast4(localAccounts, last4, preferredType) : undefined) ??
      findAccountByInstitutionAndHints(localAccounts, remote, claimedAccountIds);

    // last4 hit on an already-claimed row (shouldn't happen) → fall through to create
    if (account && claimedAccountIds.has(account.id)) {
      account = findAccountByInstitutionAndHints(localAccounts, remote, claimedAccountIds);
    }

    if (!account) {
      const createdAccount = await storage.createAccount(
        accountDefaultsForRemote(remote, localAccounts),
      );
      localAccounts.push(createdAccount);
      claimedAccountIds.add(createdAccount.id);
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

    claimedAccountIds.add(account.id);

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
    // Rename seeded Chime prepaid label once we have real checking (family bills account only)
    if (
      institution === "Chime" &&
      /prepaid/i.test(account.name) &&
      !isSavingsRemote(remote) &&
      !isJamieChimeRemote(remote, last4)
    ) {
      patch.name = "Chime Checking";
      patch.accountType = "checking";
    }
    // Keep Chime Savings labeled and typed correctly (separate from Checking)
    if (institution === "Chime" && isSavingsRemote(remote)) {
      patch.accountType = "savings";
      if (!/savings/i.test(account.name) || /checking|prepaid/i.test(account.name)) {
        patch.name = isJamieChimeRemote(remote, last4)
          ? last4
            ? `Jamie Chime Savings ··${last4}`
            : "Jamie Chime Savings"
          : "Chime Savings";
      }
    }
    // Label Jamie's personal Chime checking clearly when we know it's hers
    if (
      institution === "Chime" &&
      !isSavingsRemote(remote) &&
      isJamieChimeRemote(remote, last4) &&
      !/jamie/i.test(account.name)
    ) {
      patch.name = last4 ? `Jamie Chime Checking ··${last4}` : "Jamie Chime Checking";
      patch.owner = "Jamie";
      patch.accountType = "checking";
      patch.notes = `Synced from BankSync (Chime · Jamie). ${BANKSYNC_LIVE_NOTE}`;
    }
    if (institution === "Charles Schwab" && /roth/i.test(remote.accountName)) {
      patch.name = "Schwab Roth IRA - HB";
      patch.accountType = "investment";
      patch.owner = "Kevin";
      patch.notes = `Synced from BankSync (Charles Schwab). ${BANKSYNC_LIVE_NOTE}`;
    }

    await storage.updateAccount(account.id, patch);
    Object.assign(account, patch);
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
  const refreshedAssets = await storage.getAssets();
  const eLast4 = emergencyLast4();
  const goal = emergencyGoalAmount();
  const emergencyAccount =
    findAccountByLast4(refreshed, eLast4) ??
    refreshed.find((a) => /emergency/i.test(a.name));

  const emergencyBalance = emergencyAccount
    ? parseFloat(String(emergencyAccount.currentBalance))
    : null;

  // Push emergency savings into Net Worth cash so the page isn't stuck on the $1500 estimate
  if (emergencyBalance != null && Number.isFinite(emergencyBalance)) {
    const balanceStr = formatBalance(emergencyBalance);
    const cashAsset = matchEmergencyCashAsset(refreshedAssets);
    if (cashAsset) {
      const previous = String(cashAsset.value);
      await storage.updateAsset(cashAsset.id, {
        name: "Emergency Savings",
        value: balanceStr,
        assetType: "cash",
        owner: cashAsset.owner || "Joint",
        notes: `USAA ··${eLast4}. Goal $${goal.toFixed(0)}. ${BANKSYNC_LIVE_NOTE}`,
      });
      updates.push({
        kind: "asset",
        id: cashAsset.id,
        name: "Emergency Savings",
        last4: eLast4,
        previousBalance: previous,
        currentBalance: balanceStr,
      });
    } else {
      const createdAsset = await storage.createAsset({
        name: "Emergency Savings",
        value: balanceStr,
        assetType: "cash",
        owner: "Joint",
        notes: `USAA ··${eLast4}. Goal $${goal.toFixed(0)}. ${BANKSYNC_LIVE_NOTE}`,
      });
      created += 1;
      updates.push({
        kind: "asset",
        id: createdAsset.id,
        name: createdAsset.name,
        last4: eLast4,
        previousBalance: "0.00",
        currentBalance: balanceStr,
        created: true,
      });
    }
  }

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
