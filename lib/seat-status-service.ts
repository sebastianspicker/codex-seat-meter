import { getCodexUsageUrl, getSeatsDirectory, isDemoMode } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";
import { isCodexUsageApiResponse } from "@/lib/seat-guards";
import { isSafeSeatId, loadSeatAuth } from "@/lib/seats";
import { getMockSeatStatus, MOCK_SEATS } from "@/lib/demo-data";
import { fetchUsage } from "@/lib/usage-client";
import { mapCodexUsageToStatusResponse } from "@/lib/usage-mapper";
import type { SeatStatusResult } from "@/types/seat";

export interface SeatStatusHttpResult {
  status: number;
  body: SeatStatusResult;
}

export function isValidSeatId(id: string): boolean {
  return isSafeSeatId(id);
}

export async function fetchSeatStatus(seatId: string): Promise<SeatStatusHttpResult> {
  if (!isValidSeatId(seatId)) {
    return { status: 400, body: { ok: false, error: "Invalid seat id" } };
  }

  if (isDemoMode()) {
    const knownSeat = MOCK_SEATS.some((seat) => seat.id === seatId);
    if (!knownSeat) {
      return { status: 404, body: { ok: false, error: `Seat "${seatId}" not found` } };
    }
    return { status: 200, body: getMockSeatStatus(seatId) };
  }

  let seatsDirectory: string;
  try {
    seatsDirectory = getSeatsDirectory();
  } catch (err) {
    return {
      status: 500,
      body: { ok: false, error: getErrorMessage(err, "Server misconfigured: SEATS_DIRECTORY invalid") },
    };
  }

  let accessToken: string;
  let accountId: string | undefined;

  try {
    const auth = await loadSeatAuth(seatsDirectory, seatId);
    accessToken = auth.tokens?.access_token ?? auth.OPENAI_API_KEY ?? "";
    accountId = auth.tokens?.account_id;

    if (!accessToken) {
      return { status: 400, body: { ok: false, error: "No access token found in auth file. Ensure the file contains tokens.access_token or OPENAI_API_KEY." } };
    }
  } catch (err) {
    const e = err as NodeJS.ErrnoException | undefined;
    const message = getErrorMessage(err, "Failed to load auth");
    if (e?.code === "ENOENT") {
      return {
        status: 404,
        body: { ok: false, error: message },
      };
    }
    if (message.startsWith("Invalid ")) {
      return {
        status: 400,
        body: { ok: false, error: message },
      };
    }
    return {
      status: 500,
      body: { ok: false, error: message },
    };
  }

  let usageUrl: string;
  try {
    usageUrl = getCodexUsageUrl();
  } catch (err) {
    return {
      status: 500,
      body: { ok: false, error: getErrorMessage(err, "Server misconfigured: invalid usage URL") },
    };
  }

  const usageResult = await fetchUsage(accessToken, accountId, usageUrl);
  if (!usageResult.ok) {
    return {
      status: usageResult.status === 401 || usageResult.status === 403 ? 401 : 502,
      body: { ok: false, error: usageResult.error },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(usageResult.text);
  } catch {
    return { status: 502, body: { ok: false, error: "Invalid JSON from usage API" } };
  }

  if (!isCodexUsageApiResponse(parsed)) {
    return {
      status: 502,
      body: { ok: false, error: "Unexpected response shape from usage API" },
    };
  }

  return {
    status: 200,
    body: mapCodexUsageToStatusResponse(parsed),
  };
}
