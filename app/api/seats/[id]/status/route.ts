import { NextRequest, NextResponse } from "next/server";
import { getSeatsDirectory, getCodexUsageUrl } from "@/lib/config";
import { loadSeatAuth } from "@/lib/seats";
import { mapCodexUsageToStatusResponse } from "@/lib/usage-mapper";
import { checkDashboardAuth } from "@/lib/auth";
import type { SeatStatusError, CodexUsageApiResponse } from "@/types/seat";

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
    const message = err instanceof Error ? err.message : "Failed to load auth";
    return NextResponse.json<SeatStatusError>(
      { ok: false, error: message },
      { status: 404 }
    );
  }

  const url = getCodexUsageUrl();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "CodexSeatMeter",
    Accept: "application/json",
  };
  if (accountId) {
    headers["ChatGPT-Account-Id"] = accountId;
  }

  let res: Response;
  try {
    res = await fetch(url, { method: "GET", headers, cache: "no-store" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Network error";
    return NextResponse.json<SeatStatusError>(
      { ok: false, error: message },
      { status: 502 }
    );
  }

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json<SeatStatusError>(
      {
        ok: false,
        error: res.status === 401 || res.status === 403
          ? "Token expired or invalid"
          : `API error ${res.status}: ${text.slice(0, 200)}`,
      },
      { status: res.status === 401 || res.status === 403 ? 401 : 502 }
    );
  }

  let data: CodexUsageApiResponse;
  try {
    data = JSON.parse(text) as CodexUsageApiResponse;
  } catch {
    return NextResponse.json<SeatStatusError>(
      { ok: false, error: "Invalid JSON from usage API" },
      { status: 502 }
    );
  }

  const mapped = mapCodexUsageToStatusResponse(data);
  return NextResponse.json(mapped);
}
