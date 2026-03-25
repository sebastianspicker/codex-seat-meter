import { type NextRequest } from "next/server";
import { checkDashboardAuth } from "@/lib/auth";
import { fetchSeatStatus } from "@/lib/seat-status-service";
import { jsonNoStore } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const denied = checkDashboardAuth(request);
  if (denied) return denied;

  const { id: seatId } = await context.params;
  const result = await fetchSeatStatus(seatId);
  return jsonNoStore(result.body, { status: result.status });
}
