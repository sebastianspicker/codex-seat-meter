import { type NextRequest } from "next/server";
import { getSeatsDirectory, isDemoMode } from "@/lib/config";
import { listSeats } from "@/lib/seats";
import { MOCK_SEATS } from "@/lib/demo-data";
import { checkDashboardAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { jsonError, jsonNoStore } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const denied = checkDashboardAuth(request);
  if (denied) return denied;

  if (isDemoMode()) {
    return jsonNoStore([...MOCK_SEATS]);
  }

  try {
    const seatsDirectory = getSeatsDirectory();
    const seats = await listSeats(seatsDirectory);
    return jsonNoStore(seats);
  } catch (err) {
    return jsonError(getErrorMessage(err, "Failed to list seats"), 500);
  }
}
