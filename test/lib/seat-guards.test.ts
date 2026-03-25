// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  isAuthJson,
  isCodexUsageApiResponse,
  isSeatStatusOk,
  isSeatMetaArray,
} from "@/lib/seat-guards";

describe("isAuthJson", () => {
  it("returns true for an empty object", () => {
    expect(isAuthJson({})).toBe(true);
  });

  it("returns true for an object with auth_mode", () => {
    expect(isAuthJson({ auth_mode: "oauth" })).toBe(true);
  });

  it("returns true when tokens has access_token", () => {
    expect(isAuthJson({ tokens: { access_token: "tok" } })).toBe(true);
  });

  it("returns false when tokens is present but access_token is not a string", () => {
    expect(isAuthJson({ tokens: { access_token: 123 } })).toBe(false);
  });

  it("returns false when tokens is not an object", () => {
    expect(isAuthJson({ tokens: "invalid" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAuthJson(null)).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isAuthJson([1, 2, 3])).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isAuthJson("hello")).toBe(false);
  });

  it("returns true when tokens is null (treated as absent)", () => {
    expect(isAuthJson({ tokens: null })).toBe(true);
  });
});

describe("isCodexUsageApiResponse", () => {
  it("returns true for an empty object (rate_limit is optional)", () => {
    expect(isCodexUsageApiResponse({})).toBe(true);
  });

  it("returns true for a full valid response", () => {
    expect(
      isCodexUsageApiResponse({
        plan_type: "pro",
        rate_limit: {
          primary_window: { used_percent: 50, reset_at: 12345, limit_window_seconds: 18000 },
        },
      })
    ).toBe(true);
  });

  it("returns false when rate_limit is not an object", () => {
    expect(isCodexUsageApiResponse({ rate_limit: "bad" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isCodexUsageApiResponse(null)).toBe(false);
  });

  it("returns false for an array", () => {
    expect(isCodexUsageApiResponse([])).toBe(false);
  });

  it("returns true when rate_limit is null (treated as absent)", () => {
    expect(isCodexUsageApiResponse({ rate_limit: null })).toBe(true);
  });
});

describe("isSeatStatusOk", () => {
  it("returns true for a valid success response", () => {
    expect(
      isSeatStatusOk({
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 90 },
          weeklyUsageLimit: { label: "week", remainingPercent: 80 },
          codeReview: null,
        },
      })
    ).toBe(true);
  });

  it("returns false when ok is false", () => {
    expect(isSeatStatusOk({ ok: false, error: "fail" })).toBe(false);
  });

  it("returns false when balance is missing", () => {
    expect(isSeatStatusOk({ ok: true })).toBe(false);
  });

  it("returns false when balance is not an object", () => {
    expect(isSeatStatusOk({ ok: true, balance: "bad" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isSeatStatusOk(null)).toBe(false);
  });
});

describe("isSeatMetaArray", () => {
  it("returns true for an empty array", () => {
    expect(isSeatMetaArray([])).toBe(true);
  });

  it("returns true for an array of valid SeatMeta objects", () => {
    expect(
      isSeatMetaArray([
        { id: "seat-1", auth_mode: "oauth" },
        { id: "seat-2", error: "broken" },
      ])
    ).toBe(true);
  });

  it("returns false when an item is missing id", () => {
    expect(isSeatMetaArray([{ auth_mode: "oauth" }])).toBe(false);
  });

  it("returns false when an item id is not a string", () => {
    expect(isSeatMetaArray([{ id: 123 }])).toBe(false);
  });

  it("returns false for non-array", () => {
    expect(isSeatMetaArray({ id: "seat-1" })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isSeatMetaArray(null)).toBe(false);
  });
});
