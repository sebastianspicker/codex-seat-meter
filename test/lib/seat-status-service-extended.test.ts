// @vitest-environment node

import { describe, expect, it, vi, beforeEach } from "vitest";

// Top-level mocks that apply to all tests in this file
const mockIsDemoMode = vi.fn(() => false);
const mockGetSeatsDirectory = vi.fn(() => "/tmp/seats");
const mockGetCodexUsageUrl = vi.fn(() => "https://chatgpt.com/backend-api/wham/usage");
const mockIsSafeSeatId = vi.fn((id: string) => !id.includes(".."));
const mockLoadSeatAuth = vi.fn();
const mockFetchUsage = vi.fn();
const mockGetMockSeatStatus = vi.fn((_id: string) => ({
  ok: true,
  balance: {
    fiveHourUsageLimit: { label: "5h", remainingPercent: 80 },
    weeklyUsageLimit: { label: "week", remainingPercent: 90 },
    codeReview: null,
  },
}));

vi.mock("@/lib/config", () => ({
  isDemoMode: () => mockIsDemoMode(),
  getSeatsDirectory: () => mockGetSeatsDirectory(),
  getCodexUsageUrl: () => mockGetCodexUsageUrl(),
}));

vi.mock("@/lib/seats", () => ({
  isSafeSeatId: (id: string) => mockIsSafeSeatId(id),
  loadSeatAuth: (dir: string, id: string) => mockLoadSeatAuth(dir, id),
}));

vi.mock("@/lib/usage-client", () => ({
  fetchUsage: (token: string, accountId: string | undefined, url: string) =>
    mockFetchUsage(token, accountId, url),
}));

vi.mock("@/lib/demo-data", () => ({
  MOCK_SEATS: [{ id: "personal" }, { id: "team-alpha" }],
  getMockSeatStatus: (id: string) => mockGetMockSeatStatus(id),
}));

import { fetchSeatStatus, isValidSeatId } from "@/lib/seat-status-service";

describe("fetchSeatStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsDemoMode.mockReturnValue(false);
    mockGetSeatsDirectory.mockReturnValue("/tmp/seats");
    mockGetCodexUsageUrl.mockReturnValue("https://chatgpt.com/backend-api/wham/usage");
    mockIsSafeSeatId.mockImplementation((id: string) => !id.includes(".."));
    mockLoadSeatAuth.mockReset();
    mockFetchUsage.mockReset();
  });

  it("returns 400 for invalid seat id", async () => {
    const result = await fetchSeatStatus("../escape");
    expect(result.status).toBe(400);
    expect(result.body.ok).toBe(false);
  });

  it("returns demo data when in demo mode for known seat", async () => {
    mockIsDemoMode.mockReturnValue(true);
    const result = await fetchSeatStatus("personal");
    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
  });

  it("returns 404 in demo mode for unknown seat", async () => {
    mockIsDemoMode.mockReturnValue(true);
    const result = await fetchSeatStatus("unknown");
    expect(result.status).toBe(404);
    expect(result.body.ok).toBe(false);
  });

  it("returns 500 when getSeatsDirectory throws", async () => {
    mockGetSeatsDirectory.mockImplementation(() => {
      throw new Error("SEATS_DIRECTORY is not set");
    });
    const result = await fetchSeatStatus("seat-1");
    expect(result.status).toBe(500);
  });

  it("returns 404 when seat auth file is not found (ENOENT)", async () => {
    const err = new Error("ENOENT: no such file") as NodeJS.ErrnoException;
    err.code = "ENOENT";
    mockLoadSeatAuth.mockRejectedValue(err);

    const result = await fetchSeatStatus("missing-seat");
    expect(result.status).toBe(404);
  });

  it("returns 400 when auth error starts with 'Invalid'", async () => {
    mockLoadSeatAuth.mockRejectedValue(new Error("Invalid auth file format"));
    const result = await fetchSeatStatus("bad-seat");
    expect(result.status).toBe(400);
  });

  it("returns 500 for other loadSeatAuth errors", async () => {
    mockLoadSeatAuth.mockRejectedValue(new Error("Permission denied"));
    const result = await fetchSeatStatus("broken-seat");
    expect(result.status).toBe(500);
  });

  it("returns 400 when no access token found", async () => {
    mockLoadSeatAuth.mockResolvedValue({});
    const result = await fetchSeatStatus("no-token");
    expect(result.status).toBe(400);
    expect(result.body).toEqual({ ok: false, error: "No access token in auth file" });
  });

  it("returns 500 when getCodexUsageUrl throws", async () => {
    mockLoadSeatAuth.mockResolvedValue({ tokens: { access_token: "tok" } });
    mockGetCodexUsageUrl.mockImplementation(() => {
      throw new Error("Invalid CODEX_USAGE_BASE_URL");
    });
    const result = await fetchSeatStatus("seat-1");
    expect(result.status).toBe(500);
  });

  it("returns 401 when upstream returns 401", async () => {
    mockLoadSeatAuth.mockResolvedValue({ tokens: { access_token: "tok" } });
    mockFetchUsage.mockResolvedValue({
      ok: false,
      error: "Token expired",
      status: 401,
    });
    const result = await fetchSeatStatus("seat-1");
    expect(result.status).toBe(401);
  });

  it("returns 401 when upstream returns 403", async () => {
    mockLoadSeatAuth.mockResolvedValue({ tokens: { access_token: "tok" } });
    mockFetchUsage.mockResolvedValue({
      ok: false,
      error: "Forbidden",
      status: 403,
    });
    const result = await fetchSeatStatus("seat-1");
    expect(result.status).toBe(401);
  });

  it("returns 502 for other upstream errors", async () => {
    mockLoadSeatAuth.mockResolvedValue({ tokens: { access_token: "tok" } });
    mockFetchUsage.mockResolvedValue({
      ok: false,
      error: "Internal error",
      status: 500,
    });
    const result = await fetchSeatStatus("seat-1");
    expect(result.status).toBe(502);
  });

  it("returns 502 for invalid JSON from upstream", async () => {
    mockLoadSeatAuth.mockResolvedValue({ tokens: { access_token: "tok" } });
    mockFetchUsage.mockResolvedValue({
      ok: true,
      text: "not valid json",
      status: 200,
    });
    const result = await fetchSeatStatus("seat-1");
    expect(result.status).toBe(502);
    expect(result.body).toEqual({ ok: false, error: "Invalid JSON from usage API" });
  });

  it("returns 502 for unexpected response shape", async () => {
    mockLoadSeatAuth.mockResolvedValue({ tokens: { access_token: "tok" } });
    mockFetchUsage.mockResolvedValue({
      ok: true,
      text: JSON.stringify({ something: "else" }),
      status: 200,
    });
    const result = await fetchSeatStatus("seat-1");
    expect(result.status).toBe(502);
    expect(result.body).toEqual({ ok: false, error: "Unexpected response shape from usage API" });
  });

  it("returns 200 with mapped status on success", async () => {
    mockLoadSeatAuth.mockResolvedValue({
      tokens: { access_token: "tok", account_id: "acc-1" },
    });
    mockFetchUsage.mockResolvedValue({
      ok: true,
      text: JSON.stringify({
        plan_type: "pro",
        rate_limit: {
          primary_window: { used_percent: 30, reset_at: 1700000000, limit_window_seconds: 18000 },
          secondary_window: { used_percent: 10, reset_at: 1700600000, limit_window_seconds: 604800 },
        },
      }),
      status: 200,
    });
    const result = await fetchSeatStatus("seat-1");
    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
  });

  it("uses OPENAI_API_KEY when tokens.access_token is not present", async () => {
    mockLoadSeatAuth.mockResolvedValue({ OPENAI_API_KEY: "sk-test" });
    mockFetchUsage.mockResolvedValue({
      ok: true,
      text: JSON.stringify({
        rate_limit: {
          primary_window: { used_percent: 0, reset_at: 1700000000, limit_window_seconds: 18000 },
        },
      }),
      status: 200,
    });
    const result = await fetchSeatStatus("seat-1");
    expect(result.status).toBe(200);
    expect(mockFetchUsage).toHaveBeenCalledWith("sk-test", undefined, expect.any(String));
  });
});

describe("isValidSeatId", () => {
  it("delegates to isSafeSeatId", () => {
    expect(isValidSeatId("valid-id")).toBe(true);
    expect(isValidSeatId("../bad")).toBe(false);
  });
});
