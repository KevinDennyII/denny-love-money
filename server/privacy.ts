import type { InsertPrivacyTransaction } from "@shared/schema";
import crypto from "crypto";

const PRIVACY_API_BASE = "https://api.privacy.com/v1";

export type PrivacyApiMerchant = {
  acceptor_id?: string;
  city?: string;
  country?: string;
  descriptor?: string;
  mcc?: string;
  state?: string;
};

export type PrivacyApiCard = {
  token?: string;
  last_four?: string;
  memo?: string;
  hostname?: string;
};

export type PrivacyApiTransaction = {
  token: string;
  created: string;
  amount: number;
  settled_amount?: number;
  status: string;
  result: string;
  merchant?: PrivacyApiMerchant;
  card?: PrivacyApiCard;
  card_token?: string;
};

type PrivacyPaginatedResponse = {
  data: PrivacyApiTransaction[];
  page: number;
  total_entries: number;
  total_pages: number;
};

export type FetchPrivacyOptions = {
  /** Inclusive start date YYYY-MM-DD (Privacy `begin` query). */
  begin?: string;
};

function centsToDollars(cents: number | undefined | null): string {
  const value = typeof cents === "number" ? cents : 0;
  return (Math.abs(value) / 100).toFixed(2);
}

function getApiKey(): string {
  const key = process.env.PRIVACY_API_KEY?.trim();
  if (!key) {
    throw new Error("PRIVACY_API_KEY is not configured");
  }
  return key;
}

async function privacyFetch(path: string): Promise<Response> {
  const apiKey = getApiKey();
  return fetch(`${PRIVACY_API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `api-key ${apiKey}`,
    },
  });
}

export function beginDateDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - Math.max(days, 0));
  return d.toISOString().slice(0, 10);
}

export async function fetchApprovedPrivacyTransactions(
  options: FetchPrivacyOptions = {},
): Promise<PrivacyApiTransaction[]> {
  const all: PrivacyApiTransaction[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const params = new URLSearchParams({
      result: "APPROVED",
      page: String(page),
      page_size: "100",
    });
    if (options.begin) {
      params.set("begin", options.begin);
    }
    const res = await privacyFetch(`/transactions?${params}`);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Privacy API error (${res.status}): ${body || res.statusText}`);
    }
    const json = (await res.json()) as PrivacyPaginatedResponse;
    all.push(...(json.data ?? []));
    totalPages = json.total_pages || 1;
    page += 1;
  } while (page <= totalPages);

  return all;
}

export function mapPrivacyTransaction(tx: PrivacyApiTransaction): InsertPrivacyTransaction {
  const amountCents = tx.settled_amount ?? tx.amount ?? 0;
  return {
    privacyToken: tx.token,
    created: new Date(tx.created),
    merchantDescriptor: tx.merchant?.descriptor?.trim() || "Unknown merchant",
    merchantCity: tx.merchant?.city || null,
    merchantState: tx.merchant?.state || null,
    merchantCountry: tx.merchant?.country || null,
    merchantMcc: tx.merchant?.mcc || null,
    amount: centsToDollars(amountCents),
    settledAmount: tx.settled_amount != null ? centsToDollars(tx.settled_amount) : null,
    status: tx.status,
    result: tx.result,
    cardToken: tx.card?.token || tx.card_token || null,
    cardMemo: tx.card?.memo || tx.card?.hostname || null,
    cardLastFour: tx.card?.last_four || null,
  };
}

/** Recursively sort object keys for Privacy webhook HMAC canonicalization. */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeysDeep(obj[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Verify X-Privacy-HMAC using the API key.
 * Tries sorted-JSON and raw-body digests in base64/hex (Privacy variants).
 */
export function verifyPrivacyWebhookHmac(
  payload: unknown,
  headerValue: string | undefined,
  rawBody?: Buffer | string,
): boolean {
  if (!headerValue?.trim()) return false;
  let apiKey: string;
  try {
    apiKey = getApiKey();
  } catch {
    return false;
  }

  const provided = headerValue.trim();
  const candidates: string[] = [];

  const canonical = JSON.stringify(sortKeysDeep(payload));
  candidates.push(
    crypto.createHmac("sha256", apiKey).update(canonical).digest("base64"),
    crypto.createHmac("sha256", apiKey).update(canonical).digest("hex"),
  );

  if (rawBody) {
    const raw = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    candidates.push(
      crypto.createHmac("sha256", apiKey).update(raw).digest("base64"),
      crypto.createHmac("sha256", apiKey).update(raw).digest("hex"),
    );
  }

  const providedBuf = Buffer.from(provided);
  return candidates.some((candidate) => {
    const buf = Buffer.from(candidate);
    return buf.length === providedBuf.length && crypto.timingSafeEqual(buf, providedBuf);
  });
}

export function isPrivacyApiTransaction(value: unknown): value is PrivacyApiTransaction {
  if (!value || typeof value !== "object") return false;
  const tx = value as Record<string, unknown>;
  return typeof tx.token === "string" && typeof tx.created === "string";
}
