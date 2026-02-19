import { NextRequest, NextResponse } from "next/server";
import { getSeatsDirectory } from "@/lib/config";
import { listSeats } from "@/lib/seats";
import { checkDashboardAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const denied = checkDashboardAuth(request);
  if (denied) return denied;

  try {
    const seatsDirectory = getSeatsDirectory();
    const seats = await listSeats(seatsDirectory);
    return NextResponse.json(seats);
  } catch (err) {
    return NextResponse.json(
      { error: getErrorMessage(err, "Failed to list seats") },
      { status: 500 }
    );
  }
}
