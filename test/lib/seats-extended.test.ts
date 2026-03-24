// @vitest-environment node

import { describe, expect, it, vi, beforeEach } from "vitest";
import { isSafeSeatId, listSeats, loadSeatAuth } from "@/lib/seats";
import { readdir, readFile, access } from "fs/promises";

vi.mock("fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  access: vi.fn(),
}));

describe("isSafeSeatId", () => {
  it("accepts simple alphanumeric ids", () => {
    expect(isSafeSeatId("seat-1")).toBe(true);
    expect(isSafeSeatId("alpha")).toBe(true);
    expect(isSafeSeatId("team_beta")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isSafeSeatId("")).toBe(false);
  });

  it("rejects ids with path separators", () => {
    expect(isSafeSeatId("a/b")).toBe(false);
    expect(isSafeSeatId("a\\b")).toBe(false);
  });

  it("rejects ids with double dots", () => {
    expect(isSafeSeatId("..")).toBe(false);
    expect(isSafeSeatId("a..b")).toBe(false);
  });

  it("rejects ids with control characters", () => {
    expect(isSafeSeatId("a\x00b")).toBe(false);
    expect(isSafeSeatId("a\nb")).toBe(false);
    expect(isSafeSeatId("a\tb")).toBe(false);
  });

  it("rejects ids with leading or trailing whitespace", () => {
    expect(isSafeSeatId(" abc")).toBe(false);
    expect(isSafeSeatId("abc ")).toBe(false);
  });

  it("rejects ids exceeding 200 characters", () => {
    expect(isSafeSeatId("a".repeat(201))).toBe(false);
  });

  it("accepts ids at exactly 200 characters", () => {
    expect(isSafeSeatId("a".repeat(200))).toBe(true);
  });

  it("accepts ids with spaces in the middle", () => {
    expect(isSafeSeatId("a b")).toBe(true);
  });

  it("accepts unicode characters", () => {
    expect(isSafeSeatId("seat-\u{1F680}")).toBe(true);
  });
});

describe("listSeats", () => {
  const base = "/tmp/test-seats";

  beforeEach(() => {
    vi.mocked(access).mockResolvedValue(undefined);
  });

  it("returns empty array for empty directory", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([] as never);
    const result = await listSeats(base);
    expect(result).toEqual([]);
  });

  it("skips non-json files", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: "readme.txt", isFile: () => true },
      { name: "seat-1.json", isFile: () => true },
    ] as never);
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify({ auth_mode: "oauth" }));

    const result = await listSeats(base);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.id).toBe("seat-1");
  });

  it("skips directories", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: "subdir.json", isFile: () => false },
      { name: "valid.json", isFile: () => true },
    ] as never);
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify({}));

    const result = await listSeats(base);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.id).toBe("valid");
  });

  it("returns error for invalid auth json format", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: "bad.json", isFile: () => true },
    ] as never);
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify({ tokens: "not-object" }));

    const result = await listSeats(base);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.error).toContain("Invalid auth file format");
  });

  it("returns error for files that fail to read", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: "broken.json", isFile: () => true },
    ] as never);
    vi.mocked(readFile).mockRejectedValueOnce(new Error("Permission denied"));

    const result = await listSeats(base);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.error).toBe("Failed to read seat configuration");
  });

  it("returns error for files with invalid JSON", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: "malformed.json", isFile: () => true },
    ] as never);
    vi.mocked(readFile).mockResolvedValueOnce("{invalid json}");

    const result = await listSeats(base);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.error).toBe("Failed to read seat configuration");
  });

  it("includes auth_mode and last_refresh when present", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: "full.json", isFile: () => true },
    ] as never);
    vi.mocked(readFile).mockResolvedValueOnce(
      JSON.stringify({ auth_mode: "chatgpt", last_refresh: "2025-01-01T00:00:00Z" })
    );

    const result = await listSeats(base);
    expect(result.at(0)?.auth_mode).toBe("chatgpt");
    expect(result.at(0)?.last_refresh).toBe("2025-01-01T00:00:00Z");
  });

  it("returns undefined auth_mode/last_refresh when they are non-string", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: "nonstring.json", isFile: () => true },
    ] as never);
    vi.mocked(readFile).mockResolvedValueOnce(
      JSON.stringify({ auth_mode: 123, last_refresh: true })
    );

    const result = await listSeats(base);
    expect(result.at(0)?.auth_mode).toBeUndefined();
    expect(result.at(0)?.last_refresh).toBeUndefined();
  });

  it("sorts results alphabetically by id", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: "charlie.json", isFile: () => true },
      { name: "alpha.json", isFile: () => true },
      { name: "bravo.json", isFile: () => true },
    ] as never);
    vi.mocked(readFile).mockResolvedValue(JSON.stringify({}));

    const result = await listSeats(base);
    expect(result.map((r) => r.id)).toEqual(["alpha", "bravo", "charlie"]);
  });

  it("throws when seats directory is not accessible", async () => {
    vi.mocked(access).mockRejectedValueOnce(new Error("ENOENT"));
    await expect(listSeats(base)).rejects.toThrow("Seats directory is not accessible");
  });

  it("marks seats with unsafe ids as errors", async () => {
    vi.mocked(readdir).mockResolvedValueOnce([
      { name: "../bad.json", isFile: () => true },
    ] as never);

    const result = await listSeats(base);
    expect(result).toHaveLength(1);
    expect(result.at(0)?.error).toContain("Invalid seat id");
  });
});

describe("loadSeatAuth", () => {
  const base = "/tmp/test-seats";

  it("loads and returns valid auth json", async () => {
    const authData = { tokens: { access_token: "tok123" }, auth_mode: "oauth" };
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(authData));

    const result = await loadSeatAuth(base, "seat-1");
    expect(result.tokens?.access_token).toBe("tok123");
    expect(result.auth_mode).toBe("oauth");
  });

  it("throws for invalid auth json format", async () => {
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify({ tokens: "invalid" }));
    await expect(loadSeatAuth(base, "seat-1")).rejects.toThrow("Invalid auth file format");
  });

  it("throws for invalid JSON content", async () => {
    vi.mocked(readFile).mockResolvedValueOnce("not-json");
    await expect(loadSeatAuth(base, "seat-1")).rejects.toThrow();
  });

  it("throws for invalid seat id", async () => {
    await expect(loadSeatAuth(base, "../escape")).rejects.toThrow("Invalid seat id");
  });

  it("propagates file read errors", async () => {
    vi.mocked(readFile).mockRejectedValueOnce(new Error("ENOENT: no such file"));
    await expect(loadSeatAuth(base, "missing")).rejects.toThrow("ENOENT");
  });
});
