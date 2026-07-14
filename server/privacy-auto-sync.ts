import { storage } from "./storage";
import {
  beginDateDaysAgo,
  fetchApprovedPrivacyTransactions,
  mapPrivacyTransaction,
} from "./privacy";

let timer: ReturnType<typeof setInterval> | null = null;
let inFlight = false;

/** Recent-window sync used by the background poller (avoids re-pulling full history). */
export async function syncRecentPrivacyTransactions(days = 7): Promise<{
  fetched: number;
  upserted: number;
}> {
  if (!process.env.PRIVACY_API_KEY?.trim()) {
    throw new Error("PRIVACY_API_KEY is not configured");
  }

  const remote = await fetchApprovedPrivacyTransactions({
    begin: beginDateDaysAgo(days),
  });
  const mapped = remote.map(mapPrivacyTransaction);
  const upserted = await storage.upsertPrivacyTransactions(mapped);
  return { fetched: remote.length, upserted };
}

export function startPrivacyAutoSync(): void {
  const minutes = Number(process.env.PRIVACY_AUTO_SYNC_MINUTES ?? "15");
  if (!Number.isFinite(minutes) || minutes <= 0) {
    console.log("Privacy auto-sync disabled (PRIVACY_AUTO_SYNC_MINUTES <= 0)");
    return;
  }

  if (!process.env.PRIVACY_API_KEY?.trim()) {
    console.log("Privacy auto-sync skipped (PRIVACY_API_KEY not set)");
    return;
  }

  const days = Number(process.env.PRIVACY_AUTO_SYNC_DAYS ?? "7");
  const ms = minutes * 60 * 1000;

  const run = async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      const result = await syncRecentPrivacyTransactions(days);
      console.log(
        `Privacy auto-sync complete: fetched=${result.fetched} upserted=${result.upserted} windowDays=${days}`,
      );
    } catch (error) {
      console.error("Privacy auto-sync failed:", error);
    } finally {
      inFlight = false;
    }
  };

  setTimeout(() => {
    void run();
  }, 15_000);

  timer = setInterval(() => {
    void run();
  }, ms);

  console.log(`Privacy auto-sync enabled every ${minutes}m (last ${days} days)`);
}

export function stopPrivacyAutoSync(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
