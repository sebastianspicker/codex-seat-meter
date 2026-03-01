// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/config", () => ({
  isDemoMode: vi.fn(() => false),
  getSeatsDirectory: vi.fn(() => "/tmp/seats"),
  getCodexUsageUrl: vi.fn(() => "https://chatgpt.com/backend-api/wham/usage"),
}));

vi.mock("@/lib/seats", () => ({
  isSafeSeatId: vi.fn((id: string) => {
    if (!id) return false;
    if (id.length > 200) return false;
    if (id !== id.trim()) return false;
    if (/[\u0000-\u001F\u007F]/.test(id)) return false;
    if (id.includes("/") || id.includes("\\") || id.includes("..")) return false;
    return true;
  }),
  loadSeatAuth: vi.fn(async () => ({
    tokens: {
      access_token: "token",
      account_id: "account-id",
    },
  })),
}));

vi.mock("@/lib/demo-data", () => ({
  MOCK_SEATS: [{ id: "demo-seat" }],
  getMockSeatStatus: vi.fn((seatId: string) => ({
    ok: true,
    balance: {
      fiveHourUsageLimit: { label: "5h", remainingPercent: 90 },
      weeklyUsageLimit: { label: "week", remainingPercent: 80 },
      codeReview: null,
    },
    planType: `demo-${seatId}`,
  })),
}));

vi.mock("@/lib/usage-client", () => ({
  fetchUsage: vi.fn(async () => ({
    ok: true,
    status: 200,
    text: JSON.stringify({
      rate_limit: {
        primary_window: { used_percent: 10, reset_at: 1900000000, limit_window_seconds: 18000 },
        secondary_window: { used_percent: 20, reset_at: 1900000000, limit_window_seconds: 604800 },
      },
    }),
  })),
}));

import { getCodexUsageUrl, getSeatsDirectory, isDemoMode } from "@/lib/config";
import { getMockSeatStatus } from "@/lib/demo-data";
import { loadSeatAuth } from "@/lib/seats";
import { fetchUsage } from "@/lib/usage-client";
import { fetchSeatStatus } from "@/lib/seat-status-service";

const mockedIsDemoMode = vi.mocked(isDemoMode);
const mockedGetSeatsDirectory = vi.mocked(getSeatsDirectory);
const mockedGetUsageUrl = vi.mocked(getCodexUsageUrl);
const mockedLoadSeatAuth = vi.mocked(loadSeatAuth);
const mockedFetchUsage = vi.mocked(fetchUsage);
const mockedGetMockSeatStatus = vi.mocked(getMockSeatStatus);

beforeEach(() => {
  vi.clearAllMocks();
  mockedIsDemoMode.mockReturnValue(false);
  mockedGetSeatsDirectory.mockReturnValue("/tmp/seats");
  mockedGetUsageUrl.mockReturnValue("https://chatgpt.com/backend-api/wham/usage");
  mockedLoadSeatAuth.mockResolvedValue({
    tokens: {
      access_token: "token",
      account_id: "account-id",
    },
  });
  mockedFetchUsage.mockResolvedValue({
    ok: true,
    status: 200,
    text: JSON.stringify({
      rate_limit: {
        primary_window: { used_percent: 10, reset_at: 1900000000, limit_window_seconds: 18000 },
        secondary_window: { used_percent: 20, reset_at: 1900000000, limit_window_seconds: 604800 },
      },
    }),
  });
});

describe("fetchSeatStatus", () => {
  it("returns 400 for invalid seat ids", async () => {
    const result = await fetchSeatStatus("../bad");
    expect(result).toEqual({ status: 400, body: { ok: false, error: "Invalid seat id" } });
  });

  it("returns 400 for ids with control characters", async () => {
    const result = await fetchSeatStatus("bad\nseat");
    expect(result).toEqual({ status: 400, body: { ok: false, error: "Invalid seat id" } });
  });

  it("returns demo status in demo mode", async () => {
    mockedIsDemoMode.mockReturnValue(true);

    const result = await fetchSeatStatus("demo-seat");
    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(mockedGetMockSeatStatus).toHaveBeenCalledWith("demo-seat");
  });

  it("returns 404 for unknown seat id in demo mode", async () => {
    mockedIsDemoMode.mockReturnValue(true);

    const result = await fetchSeatStatus("unknown-seat");
    expect(result).toEqual({
      status: 404,
      body: { ok: false, error: 'Seat "unknown-seat" not found' },
    });
  });

  it("returns 401 when upstream returns auth errors", async () => {
    mockedFetchUsage.mockResolvedValue({ ok: false, status: 401, error: "Token expired or invalid" });

    const result = await fetchSeatStatus("team-alpha");
    expect(result).toEqual({
      status: 401,
      body: { ok: false, error: "Token expired or invalid" },
    });
  });

  it("returns mapped seat status on success", async () => {
    const result = await fetchSeatStatus("team-alpha");
    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(mockedLoadSeatAuth).toHaveBeenCalledWith("/tmp/seats", "team-alpha");
    expect(mockedFetchUsage).toHaveBeenCalled();
  });

  it("returns 500 when usage URL config is invalid", async () => {
    mockedGetUsageUrl.mockImplementation(() => {
      throw new Error("Invalid CODEX_USAGE_BASE_URL or CODEX_USAGE_PATH");
    });

    const result = await fetchSeatStatus("team-alpha");
    expect(result).toEqual({
      status: 500,
      body: { ok: false, error: "Invalid CODEX_USAGE_BASE_URL or CODEX_USAGE_PATH" },
    });
  });

  it("returns 400 when auth file format is invalid", async () => {
    mockedLoadSeatAuth.mockRejectedValue(new Error("Invalid auth file format in team-alpha.json"));

    const result = await fetchSeatStatus("team-alpha");
    expect(result).toEqual({
      status: 400,
      body: { ok: false, error: "Invalid auth file format in team-alpha.json" },
    });
  });

  it("returns 500 for non-not-found auth read failures", async () => {
    const err = Object.assign(new Error("Permission denied"), { code: "EACCES" });
    mockedLoadSeatAuth.mockRejectedValue(err);

    const result = await fetchSeatStatus("team-alpha");
    expect(result).toEqual({
      status: 500,
      body: { ok: false, error: "Permission denied" },
    });
  });
});
