import { NextRequest, NextResponse } from "next/server";

/**
 * Simple shared-secret guard for API routes.
 *
 * When DASHBOARD_SECRET is set in env, every API request must include
 * either:
 *   - Header `x-dashboard-secret: <secret>`
 *   - Query param `?secret=<secret>`
 *
 * When DASHBOARD_SECRET is NOT set, all requests are allowed (local-only use).
 */
export function checkDashboardAuth(request: NextRequest): NextResponse | null {
  const secret = process.env.DASHBOARD_SECRET?.trim();
  if (!secret) {
    return null; // no auth configured → allow
  }

  const headerVal = request.headers.get("x-dashboard-secret");
  const queryVal = request.nextUrl.searchParams.get("secret");

  if (headerVal === secret || queryVal === secret) {
    return null; // authorized
  }

  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}
