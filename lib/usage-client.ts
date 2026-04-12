/**
 * HTTP client for the upstream Codex wham/usage API.
 * Includes retry logic for transient failures (429, 502, 503).
 */
import { getErrorMessage } from "@/lib/errors";

type FetchUsageSuccess = { ok: true; text: string; status: number };
type FetchUsageError = {
  ok: false;
  error: string;
  status: number;
};
type FetchUsageResult = FetchUsageSuccess | FetchUsageError;

const RETRY_STATUSES = [429, 502, 503];
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 800;

/** Translate raw HTTP status codes into user-friendly descriptions. */
function describeUpstreamStatus(status: number): string {
  switch (status) {
    case 429:
      return "Rate limited by upstream API. Try again in a few minutes.";
    case 500:
      return "Upstream API internal error. Try again later.";
    case 502:
      return "Upstream API is unreachable (bad gateway). Try again later.";
    case 503:
      return "Upstream API is temporarily unavailable. Try again later.";
    case 504:
      return "Upstream API timed out (gateway timeout). Try again later.";
    default:
      return `Upstream API returned an unexpected error (HTTP ${status}).`;
  }
}

function buildHeaders(accessToken: string, accountId?: string): Record<string, string> {
  const safeToken = accessToken.replace(/[\r\n]/g, "");
  const headers: Record<string, string> = {
    Authorization: `Bearer ${safeToken}`,
    "User-Agent": "CodexSeatMeter",
    Accept: "application/json",
  };
  if (accountId) {
    const safeAccountId = accountId.replace(/[\r\n]/g, "");
    headers["ChatGPT-Account-Id"] = safeAccountId;
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
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const res = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: controller.signal,
      });

      const text = await res.text();

      if (res.ok) {
        return { ok: true, text, status: res.status };
      }

      const status = res.status;
      if (status === 401 || status === 403) {
        return { ok: false, error: "Token expired or invalid. Re-authenticate and update the seat auth file.", status };
      }

      if (RETRY_STATUSES.includes(status) && attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      // Log only status/attempt — response body may contain sensitive data
      console.error(`[fetchUsage] API error ${status} on attempt ${attempt}`);
      const friendlyMessage = describeUpstreamStatus(status);
      return { ok: false, error: friendlyMessage, status };
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      return { ok: false, error: getErrorMessage(err, "Network error. Check your internet connection and try again."), status: 502 };
    } finally {
      if (timeoutId != null) {
        clearTimeout(timeoutId);
      }
    }
  }

  return { ok: false, error: "Upstream API unreachable after multiple attempts. Try again later.", status: 502 };
}
