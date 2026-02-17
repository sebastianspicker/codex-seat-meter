import { NextRequest, NextResponse } from "next/server";
import { getSeatsDirectory } from "@/lib/config";
import { listSeats } from "@/lib/seats";
import { checkDashboardAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const denied = checkDashboardAuth(request);
  if (denied) return denied;

  try {
    const seatsDirectory = getSeatsDirectory();
    const seats = await listSeats(seatsDirectory);
    return NextResponse.json(seats);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list seats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
