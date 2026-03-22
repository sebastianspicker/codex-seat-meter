import { type NextRequest } from "next/server";
import { checkDashboardAuth } from "@/lib/auth";
import { jsonError, jsonNoStore } from "@/lib/api-response";
import { fetchSeatStatus, isValidSeatId } from "@/lib/seat-status-service";
import type { SeatStatusesResponse } from "@/types/seat";

const MAX_BATCH_IDS = 50;
const FETCH_CONCURRENCY = 5;

function parseSeatIds(request: NextRequest): string[] {
  const repeatedIdParams = request.nextUrl.searchParams
    .getAll("id")
    .map((id) => id.trim())
    .filter(Boolean);
  if (repeatedIdParams.length > 0) {
    return [...new Set(repeatedIdParams)];
  }

  const idsParam = request.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return [];
  }

  const ids = idsParam
    .split(",")
    .map((raw) => raw.trim())
    .filter(Boolean);
  return [...new Set(ids)];
}

export async function GET(request: NextRequest) {
  const denied = checkDashboardAuth(request);
  if (denied) return denied;

  const seatIds = parseSeatIds(request);
  if (seatIds.length === 0) {
    return jsonError("Missing required query parameter: ids", 400);
  }
  if (seatIds.length > MAX_BATCH_IDS) {
    return jsonError(`Too many seat ids requested (max ${MAX_BATCH_IDS})`, 400);
  }

  if (seatIds.some((id) => !isValidSeatId(id))) {
    return jsonError("One or more seat ids are invalid", 400);
  }

  const results: Array<readonly [string, Awaited<ReturnType<typeof fetchSeatStatus>>]> = [];
  for (let start = 0; start < seatIds.length; start += FETCH_CONCURRENCY) {
    const chunk = seatIds.slice(start, start + FETCH_CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (id) => [id, await fetchSeatStatus(id)] as const)
    );
    results.push(...chunkResults);
  }

  const statuses = Object.fromEntries(results.map(([id, result]) => [id, result.body]));

  const payload: SeatStatusesResponse = {
    ok: true,
    fetchedAt: new Date().toISOString(),
    statuses,
  };

  return jsonNoStore(payload);
}
