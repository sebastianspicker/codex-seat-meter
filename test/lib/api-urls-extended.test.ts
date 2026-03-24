import { describe, expect, it } from "vitest";
import { getSeatsUrl, getSeatStatusUrl, getSeatStatusesUrl } from "@/lib/api-urls";

describe("getSeatsUrl", () => {
  it("returns the seats API URL", () => {
    const url = getSeatsUrl();
    expect(url).toBe("http://localhost/api/seats");
  });

  it("returns a valid URL", () => {
    const parsed = new URL(getSeatsUrl());
    expect(parsed.pathname).toBe("/api/seats");
  });
});

describe("getSeatStatusUrl", () => {
  it("builds a status URL for a simple seat id", () => {
    const url = getSeatStatusUrl("team-alpha");
    expect(url).toBe("http://localhost/api/seats/team-alpha/status");
  });

  it("encodes special characters in seat id", () => {
    const url = getSeatStatusUrl("seat with spaces");
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/seats/seat%20with%20spaces/status");
  });

  it("encodes slash characters in seat id", () => {
    const url = getSeatStatusUrl("a/b");
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/seats/a%2Fb/status");
  });
});

describe("getSeatStatusesUrl", () => {
  it("builds URL with multiple id params", () => {
    const url = getSeatStatusesUrl(["alpha", "beta"]);
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/seats/statuses");
    expect(parsed.searchParams.getAll("id")).toEqual(["alpha", "beta"]);
  });

  it("returns URL with empty search params for empty array", () => {
    const url = getSeatStatusesUrl([]);
    const parsed = new URL(url);
    expect(parsed.pathname).toBe("/api/seats/statuses");
    expect(parsed.searchParams.getAll("id")).toEqual([]);
  });
});
