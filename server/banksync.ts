const BANKSYNC_API_BASE = "https://api.banksync.io/v1";

export type BanksyncBank = {
  id: string;
  name: string;
  source?: string;
  type?: string;
  connectionStatus?: { connected?: boolean };
};

export type BanksyncAccount = {
  id: string;
  bankId: string;
  /** Institution name from the parent bank connection (USAA, Chime, …). */
  bankName?: string;
  accountNumber?: string | null;
  accountName: string;
  accountType: string;
  balance: number;
  availableBalance?: number | null;
  currency?: string;
  creditLimit?: number | null;
  balanceAsOf?: string | null;
  updatedAt?: string;
};

type BanksyncListResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

function getApiKey(): string {
  const key = process.env.BANKSYNC_API_KEY?.trim();
  if (!key) {
    throw new Error("BANKSYNC_API_KEY is not configured");
  }
  return key;
}

export function isBanksyncConfigured(): boolean {
  return Boolean(process.env.BANKSYNC_API_KEY?.trim());
}

export function emergencyLast4(): string {
  return (process.env.BANKSYNC_EMERGENCY_LAST4 ?? "1559").replace(/\D/g, "").slice(-4);
}

export function emergencyGoalAmount(): number {
  const raw = Number(process.env.BANKSYNC_EMERGENCY_GOAL ?? "1500");
  return Number.isFinite(raw) && raw > 0 ? raw : 1500;
}

async function banksyncFetch(path: string): Promise<Response> {
  const apiKey = getApiKey();
  return fetch(`${BANKSYNC_API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
      "User-Agent": "DennyLoveMoney/1.0",
    },
  });
}

async function banksyncJson<T>(path: string): Promise<T> {
  const res = await banksyncFetch(path);
  const body = (await res.json()) as BanksyncListResponse<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error || `BankSync API error (${res.status})`);
  }
  return body.data;
}

/** Digits only, last 4 from masked account numbers like `****1559` or `**** **** **** 0517`. */
export function extractLast4(accountNumber: string | null | undefined): string | null {
  if (!accountNumber) return null;
  const digits = accountNumber.replace(/\D/g, "");
  if (digits.length < 4) return null;
  return digits.slice(-4);
}

export function formatBalance(amount: number): string {
  return Number(amount).toFixed(2);
}

export async function listBanks(): Promise<BanksyncBank[]> {
  return banksyncJson<BanksyncBank[]>("/banks");
}

export async function listAccountsForBank(bankId: string): Promise<BanksyncAccount[]> {
  return banksyncJson<BanksyncAccount[]>(`/banks/${bankId}/accounts`);
}

export async function listAllAccounts(): Promise<{
  banks: BanksyncBank[];
  accounts: BanksyncAccount[];
}> {
  const banks = await listBanks();
  const accountLists = await Promise.all(
    banks.map(async (b) => {
      const accounts = await listAccountsForBank(b.id);
      return accounts.map((a) => ({ ...a, bankName: b.name, bankId: a.bankId || b.id }));
    }),
  );
  return {
    banks,
    accounts: accountLists.flat(),
  };
}
