import { type NextRequest, type NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import { allowDashboardSecretQueryParam, getDashboardSecret } from "./config";
import { jsonNoStore } from "./api-response";

/** Hash input to fixed-length buffer for constant-time comparison (avoids length probing). */
function sha256(s: string): Buffer {
  return createHash("sha256").update(s, "utf8").digest();
}

/**
 * Simple shared-secret guard for API routes.
 *
 * When DASHBOARD_SECRET is set in env, every API request must include
 * either:
 *   - Header `x-dashboard-secret: <secret>`
 *   - Query param `?secret=<secret>`
 *
 * When DASHBOARD_SECRET is NOT set, all requests are allowed (local-only use).
 * Comparison is constant-time (SHA-256 then timingSafeEqual) to avoid secret-length probing.
 */
export function checkDashboardAuth(request: NextRequest): NextResponse | null {
  const secret = getDashboardSecret();
  if (!secret) {
    return null; // no auth configured → allow
  }

  const headerVal = request.headers.get("x-dashboard-secret") ?? "";
  const queryVal = allowDashboardSecretQueryParam()
    ? request.nextUrl.searchParams.get("secret") ?? ""
    : "";

  const secretHash = sha256(secret);
  const headerHash = sha256(headerVal);
  const queryHash = sha256(queryVal);

  let isAuthorized = false;
  if (secretHash.length === headerHash.length) {
    try {
      if (timingSafeEqual(secretHash, headerHash)) isAuthorized = true;
    } catch {
      // length mismatch (should not happen for SHA-256)
    }
  }
  if (!isAuthorized && secretHash.length === queryHash.length) {
    try {
      if (timingSafeEqual(secretHash, queryHash)) isAuthorized = true;
    } catch {
      // length mismatch
    }
  }

  if (isAuthorized) {
    return null; // authorized
  }

  return jsonNoStore({ error: "Unauthorized" }, { status: 401 });
}
