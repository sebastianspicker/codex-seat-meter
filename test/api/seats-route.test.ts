// @vitest-environment node

import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  checkDashboardAuth: vi.fn(() => null),
}));

vi.mock("@/lib/config", () => ({
  getSeatsDirectory: vi.fn(() => "/tmp/test-seats"),
  isDemoMode: vi.fn(() => false),
  getDashboardSecret: vi.fn(() => ""),
  allowDashboardSecretQueryParam: vi.fn(() => false),
  getCodexUsageUrl: vi.fn(() => "https://chatgpt.com/backend-api/wham/usage"),
}));

vi.mock("@/lib/seats", () => ({
  listSeats: vi.fn(async () => [
    { id: "seat-1", auth_mode: "oauth" },
    { id: "seat-2", auth_mode: "api-key" },
  ]),
}));

describe("GET /api/seats", () => {
  it("returns list of seats on success", async () => {
    const { GET } = await import("@/app/api/seats/route");
    const req = new NextRequest("http://localhost/api/seats");

    const response = await GET(req);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveLength(2);
    expect(payload[0].id).toBe("seat-1");
    expect(payload[1].id).toBe("seat-2");
  });

  it("returns 401 when auth check fails", async () => {
    const { NextResponse } = await import("next/server");
    const { checkDashboardAuth } = await import("@/lib/auth");
    vi.mocked(checkDashboardAuth).mockReturnValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const { GET } = await import("@/app/api/seats/route");
    const req = new NextRequest("http://localhost/api/seats");

    const response = await GET(req);
    expect(response.status).toBe(401);
  });

  it("returns 500 when getSeatsDirectory throws", async () => {
    const { getSeatsDirectory } = await import("@/lib/config");
    vi.mocked(getSeatsDirectory).mockImplementationOnce(() => {
      throw new Error("SEATS_DIRECTORY is not set. Add it to .env or set DEMO_MODE=1 for mock data.");
    });

    const { GET } = await import("@/app/api/seats/route");
    const req = new NextRequest("http://localhost/api/seats");

    const response = await GET(req);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("SEATS_DIRECTORY is not set. Add it to .env or set DEMO_MODE=1 for mock data.");
  });

  it("returns 500 when listSeats throws", async () => {
    const { listSeats } = await import("@/lib/seats");
    vi.mocked(listSeats).mockRejectedValueOnce(new Error("Directory not readable"));

    const { GET } = await import("@/app/api/seats/route");
    const req = new NextRequest("http://localhost/api/seats");

    const response = await GET(req);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error).toBe("Directory not readable");
  });
});
