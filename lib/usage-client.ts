import { getErrorMessage } from "@/lib/errors";

export type FetchUsageSuccess = { ok: true; text: string; status: number };
export type FetchUsageError = {
  ok: false;
  error: string;
  status: number;
};
export type FetchUsageResult = FetchUsageSuccess | FetchUsageError;

const RETRY_STATUSES = [429, 502, 503];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

function buildHeaders(accessToken: string, accountId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "CodexSeatMeter",
    Accept: "application/json",
  };
  if (accountId) {
    headers["ChatGPT-Account-Id"] = accountId;
  }
  return headers;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch usage data from the Codex wham/usage API.
 * Retries on 429, 502, 503 up to MAX_RETRIES with backoff.
 */
export async function fetchUsage(
  accessToken: string,
  accountId: string | undefined,
  url: string
): Promise<FetchUsageResult> {
  const headers = buildHeaders(accessToken, accountId);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { method: "GET", headers, cache: "no-store" });
      const text = await res.text();

      if (res.ok) {
        return { ok: true, text, status: res.status };
      }

      const status = res.status;
      if (status === 401 || status === 403) {
        return { ok: false, error: "Token expired or invalid", status };
      }

      if (RETRY_STATUSES.includes(status) && attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      return { ok: false, error: `API error ${status}: ${text.slice(0, 200)}`, status };
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      return { ok: false, error: getErrorMessage(err, "Network error"), status: 502 };
    }
  }

  return { ok: false, error: "Max retries exceeded", status: 502 };
}
