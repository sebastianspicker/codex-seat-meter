// @vitest-environment node

import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  checkDashboardAuth: vi.fn(() => null),
}));

vi.mock("@/lib/seat-status-service", () => ({
  fetchSeatStatus: vi.fn(async (id: string) => {
    if (id === "ok-seat") {
      return {
        status: 200,
        body: {
          ok: true,
          balance: {
            fiveHourUsageLimit: { label: "5h", remainingPercent: 80, resetLabel: "in 3h" },
            weeklyUsageLimit: { label: "Weekly", remainingPercent: 90, resetLabel: "in 5d" },
          },
        },
      };
    }
    if (id === "missing-seat") {
      return { status: 404, body: { ok: false, error: "Seat not found" } };
    }
    return { status: 500, body: { ok: false, error: "Internal error" } };
  }),
}));

// api-response uses actual implementation (no mock needed)

describe("GET /api/seats/:id/status", () => {
  it("returns mapped seat status on success", async () => {
    const { GET } = await import("@/app/api/seats/[id]/status/route");
    const req = new NextRequest("http://localhost/api/seats/ok-seat/status");
    const response = await GET(req, { params: Promise.resolve({ id: "ok-seat" }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.balance).toBeDefined();
  });

  it("returns 401 when auth check fails", async () => {
    const { checkDashboardAuth } = await import("@/lib/auth");
    const mock = vi.mocked(checkDashboardAuth);
    mock.mockReturnValueOnce(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    const { GET } = await import("@/app/api/seats/[id]/status/route");
    const req = new NextRequest("http://localhost/api/seats/ok-seat/status");
    const response = await GET(req, { params: Promise.resolve({ id: "ok-seat" }) });

    expect(response.status).toBe(401);
    mock.mockReturnValue(null);
  });

  it("returns 404 when seat is not found", async () => {
    const { GET } = await import("@/app/api/seats/[id]/status/route");
    const req = new NextRequest("http://localhost/api/seats/missing-seat/status");
    const response = await GET(req, { params: Promise.resolve({ id: "missing-seat" }) });
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.ok).toBe(false);
  });

  it("returns 500 on internal error", async () => {
    const { GET } = await import("@/app/api/seats/[id]/status/route");
    const req = new NextRequest("http://localhost/api/seats/error-seat/status");
    const response = await GET(req, { params: Promise.resolve({ id: "error-seat" }) });

    expect(response.status).toBe(500);
  });
});
