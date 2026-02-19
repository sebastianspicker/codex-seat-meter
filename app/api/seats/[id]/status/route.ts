import { NextRequest, NextResponse } from "next/server";
import { getSeatsDirectory, getCodexUsageUrl } from "@/lib/config";
import { loadSeatAuth } from "@/lib/seats";
import { mapCodexUsageToStatusResponse } from "@/lib/usage-mapper";
import { fetchUsage } from "@/lib/usage-client";
import { checkDashboardAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { isCodexUsageApiResponse } from "@/types/seat";
import type { SeatStatusError } from "@/types/seat";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const denied = checkDashboardAuth(request);
  if (denied) return denied;

  const { id: seatId } = await context.params;
  if (!seatId) {
    return NextResponse.json<SeatStatusError>(
      { ok: false, error: "Missing seat id" },
      { status: 400 }
    );
  }

  let seatsDirectory: string;
  try {
    seatsDirectory = getSeatsDirectory();
  } catch {
    return NextResponse.json<SeatStatusError>(
      { ok: false, error: "Server misconfigured: SEATS_DIRECTORY not set" },
      { status: 500 }
    );
  }

  let accessToken: string;
  let accountId: string | undefined;
  try {
    const auth = await loadSeatAuth(seatsDirectory, seatId);
    accessToken =
      auth.tokens?.access_token ?? auth.OPENAI_API_KEY ?? "";
    accountId = auth.tokens?.account_id;
    if (!accessToken) {
      return NextResponse.json<SeatStatusError>(
        { ok: false, error: "No access token in auth file" },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json<SeatStatusError>(
      { ok: false, error: getErrorMessage(err, "Failed to load auth") },
      { status: 404 }
    );
  }

  const url = getCodexUsageUrl();
  const result = await fetchUsage(accessToken, accountId, url);

  if (!result.ok) {
    return NextResponse.json<SeatStatusError>(
      { ok: false, error: result.error },
      { status: result.status === 401 || result.status === 403 ? 401 : 502 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    return NextResponse.json<SeatStatusError>(
      { ok: false, error: "Invalid JSON from usage API" },
      { status: 502 }
    );
  }

  if (!isCodexUsageApiResponse(parsed)) {
    return NextResponse.json<SeatStatusError>(
      { ok: false, error: "Unexpected response shape from usage API" },
      { status: 502 }
    );
  }

  const mapped = mapCodexUsageToStatusResponse(parsed);
  return NextResponse.json(mapped);
}
