// @vitest-environment node

import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  checkDashboardAuth: vi.fn(() => null),
}));

vi.mock("@/lib/seat-status-service", () => ({
  isValidSeatId: vi.fn(() => true),
  fetchSeatStatus: vi.fn(async (seatId: string) => {
    if (seatId === "broken") {
      return { status: 502, body: { ok: false, error: "boom" } };
    }
    return {
      status: 200,
      body: {
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 90 },
          weeklyUsageLimit: { label: "week", remainingPercent: 80 },
          codeReview: null,
        },
      },
    };
  }),
}));

describe("GET /api/seats/statuses", () => {
  it("returns 400 when ids query is missing", async () => {
    const { GET } = await import("@/app/api/seats/statuses/route");
    const req = new NextRequest("http://localhost/api/seats/statuses");

    const response = await GET(req);
    expect(response.status).toBe(400);
  });

  it("returns mixed partial results", async () => {
    const { GET } = await import("@/app/api/seats/statuses/route");
    const req = new NextRequest("http://localhost/api/seats/statuses?id=ok&id=broken");

    const response = await GET(req);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.statuses.ok.ok).toBe(true);
    expect(payload.statuses.broken.ok).toBe(false);
  });

  it("supports percent characters in legacy comma-delimited ids", async () => {
    const { GET } = await import("@/app/api/seats/statuses/route");
    const req = new NextRequest("http://localhost/api/seats/statuses?ids=ok%25,broken");

    const response = await GET(req);
    expect(response.status).toBe(200);
  });

  it("returns 400 when too many ids are requested", async () => {
    const { GET } = await import("@/app/api/seats/statuses/route");
    const ids = Array.from({ length: 51 }, (_, i) => `seat-${i}`).join(",");
    const req = new NextRequest(`http://localhost/api/seats/statuses?ids=${ids}`);

    const response = await GET(req);
    expect(response.status).toBe(400);
  });

  it("supports legacy comma-delimited ids query", async () => {
    const { GET } = await import("@/app/api/seats/statuses/route");
    const req = new NextRequest("http://localhost/api/seats/statuses?ids=ok,broken");

    const response = await GET(req);
    expect(response.status).toBe(200);
  });

  it("returns 400 when 0 seat IDs are provided (empty ids param)", async () => {
    const { GET } = await import("@/app/api/seats/statuses/route");
    const req = new NextRequest("http://localhost/api/seats/statuses?ids=");

    const response = await GET(req);
    expect(response.status).toBe(400);
  });

  it("accepts exactly 50 seat IDs (the max)", async () => {
    const { GET } = await import("@/app/api/seats/statuses/route");
    const ids = Array.from({ length: 50 }, (_, i) => `seat-${i}`).join(",");
    const req = new NextRequest(`http://localhost/api/seats/statuses?ids=${ids}`);

    const response = await GET(req);
    expect(response.status).toBe(200);
  });

  it("returns 400 when 51 seat IDs are requested (one over max)", async () => {
    const { GET } = await import("@/app/api/seats/statuses/route");
    const ids = Array.from({ length: 51 }, (_, i) => `seat-${i}`).join(",");
    const req = new NextRequest(`http://localhost/api/seats/statuses?ids=${ids}`);

    const response = await GET(req);
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toMatch(/too many/i);
  });
});
