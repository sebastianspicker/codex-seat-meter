// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { checkDashboardAuth } from "@/lib/auth";

const ENV = {
  DASHBOARD_SECRET: process.env.DASHBOARD_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  ALLOW_DASHBOARD_SECRET_QUERY: process.env.ALLOW_DASHBOARD_SECRET_QUERY,
};
const MUTABLE_ENV = process.env as Record<string, string | undefined>;

afterEach(() => {
  process.env.DASHBOARD_SECRET = ENV.DASHBOARD_SECRET;
  MUTABLE_ENV.NODE_ENV = ENV.NODE_ENV;
  process.env.ALLOW_DASHBOARD_SECRET_QUERY = ENV.ALLOW_DASHBOARD_SECRET_QUERY;
});

describe("checkDashboardAuth", () => {
  it("authorizes matching header", () => {
    process.env.DASHBOARD_SECRET = "supersecret";
    MUTABLE_ENV.NODE_ENV = "production";
    delete process.env.ALLOW_DASHBOARD_SECRET_QUERY;

    const req = new NextRequest("http://localhost/api/seats", {
      headers: { "x-dashboard-secret": "supersecret" },
    });

    expect(checkDashboardAuth(req)).toBeNull();
  });

  it("rejects query-secret auth in production by default", () => {
    process.env.DASHBOARD_SECRET = "supersecret";
    MUTABLE_ENV.NODE_ENV = "production";
    delete process.env.ALLOW_DASHBOARD_SECRET_QUERY;

    const req = new NextRequest("http://localhost/api/seats?secret=supersecret");
    const denied = checkDashboardAuth(req);

    expect(denied?.status).toBe(401);
  });

  it("allows query-secret auth when explicitly enabled", () => {
    process.env.DASHBOARD_SECRET = "supersecret";
    MUTABLE_ENV.NODE_ENV = "production";
    process.env.ALLOW_DASHBOARD_SECRET_QUERY = "1";

    const req = new NextRequest("http://localhost/api/seats?secret=supersecret");
    expect(checkDashboardAuth(req)).toBeNull();
  });

  it("allows all requests when DASHBOARD_SECRET is empty string", () => {
    process.env.DASHBOARD_SECRET = "";
    MUTABLE_ENV.NODE_ENV = "production";

    const req = new NextRequest("http://localhost/api/seats");
    // Empty string secret means no auth configured, so all requests are allowed
    expect(checkDashboardAuth(req)).toBeNull();
  });

  it("allows all requests when DASHBOARD_SECRET is only whitespace", () => {
    process.env.DASHBOARD_SECRET = "   ";
    MUTABLE_ENV.NODE_ENV = "production";

    const req = new NextRequest("http://localhost/api/seats");
    // Whitespace-only secret is trimmed to empty, so no auth configured
    expect(checkDashboardAuth(req)).toBeNull();
  });

  it("handles a very long secret correctly", () => {
    const longSecret = "a".repeat(10000);
    process.env.DASHBOARD_SECRET = longSecret;
    MUTABLE_ENV.NODE_ENV = "production";

    // Correct long secret in header should authorize
    const authReq = new NextRequest("http://localhost/api/seats", {
      headers: { "x-dashboard-secret": longSecret },
    });
    expect(checkDashboardAuth(authReq)).toBeNull();

    // Wrong secret should reject
    const badReq = new NextRequest("http://localhost/api/seats", {
      headers: { "x-dashboard-secret": "wrong" },
    });
    const denied = checkDashboardAuth(badReq);
    expect(denied?.status).toBe(401);
  });

  it("rejects requests when secret is set but header is missing", () => {
    process.env.DASHBOARD_SECRET = "supersecret";
    MUTABLE_ENV.NODE_ENV = "production";
    delete process.env.ALLOW_DASHBOARD_SECRET_QUERY;

    const req = new NextRequest("http://localhost/api/seats");
    const denied = checkDashboardAuth(req);
    expect(denied?.status).toBe(401);
  });
});
