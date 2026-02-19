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
  let lastResult: FetchUsageResult | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { method: "GET", headers, cache: "no-store" });
    } catch (err) {
      return {
        ok: false,
        error: getErrorMessage(err, "Network error"),
        status: 502,
      };
    }

    let text: string;
    try {
      text = await res.text();
    } catch (err) {
      return {
        ok: false,
        error: getErrorMessage(err, "Failed to read response body"),
        status: 502,
      };
    }

    if (res.ok) {
      return { ok: true, text, status: res.status };
    }

    const status = res.status;
    const errorMessage =
      status === 401 || status === 403
        ? "Token expired or invalid"
        : `API error ${status}: ${text.slice(0, 200)}`;

    lastResult = { ok: false, error: errorMessage, status };

    if (status === 401 || status === 403) {
      return lastResult;
    }

    const shouldRetry =
      RETRY_STATUSES.includes(status) && attempt < MAX_RETRIES;
    if (shouldRetry) {
      await delay(RETRY_DELAY_MS * (attempt + 1));
      continue;
    }

    return lastResult;
  }

  return lastResult!;
}
