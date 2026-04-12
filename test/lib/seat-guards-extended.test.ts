// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
  isRecord,
  isAuthJson,
  isCodexUsageApiResponse,
  isSeatStatusOk,
  isSeatStatusResult,
  isSeatStatusesResponse,
  isSeatMetaArray,
} from "@/lib/seat-guards";

describe("isRecord", () => {
  it("returns true for plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it("returns false for null", () => {
    expect(isRecord(null)).toBe(false);
  });

  it("returns false for arrays", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2])).toBe(false);
  });

  it("returns false for primitives", () => {
    expect(isRecord("string")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });
});

describe("isCodexUsageApiResponse - extended", () => {
  it("returns true when both primary and secondary windows exist", () => {
    expect(
      isCodexUsageApiResponse({
        rate_limit: {
          primary_window: { used_percent: 50, reset_at: 12345 },
          secondary_window: { used_percent: 30, reset_at: 67890 },
        },
      })
    ).toBe(true);
  });

  it("returns true with only secondary_window", () => {
    expect(
      isCodexUsageApiResponse({
        rate_limit: {
          secondary_window: { used_percent: 30, reset_at: 67890 },
        },
      })
    ).toBe(true);
  });

  it("returns true when neither window exists (empty rate_limit is valid)", () => {
    expect(
      isCodexUsageApiResponse({
        rate_limit: {},
      })
    ).toBe(true);
  });

  it("returns false when primary_window has invalid used_percent", () => {
    expect(
      isCodexUsageApiResponse({
        rate_limit: {
          primary_window: { used_percent: "not a number", reset_at: 12345 },
        },
      })
    ).toBe(false);
  });

  it("returns false when primary_window has NaN used_percent", () => {
    expect(
      isCodexUsageApiResponse({
        rate_limit: {
          primary_window: { used_percent: NaN, reset_at: 12345 },
        },
      })
    ).toBe(false);
  });

  it("returns false when primary_window has Infinity reset_at", () => {
    expect(
      isCodexUsageApiResponse({
        rate_limit: {
          primary_window: { used_percent: 50, reset_at: Infinity },
        },
      })
    ).toBe(false);
  });

  it("returns false when secondary_window is not a valid usage window", () => {
    expect(
      isCodexUsageApiResponse({
        rate_limit: {
          primary_window: { used_percent: 50, reset_at: 12345 },
          secondary_window: { used_percent: "bad" },
        },
      })
    ).toBe(false);
  });
});

describe("isSeatStatusOk - extended", () => {
  it("returns false when fiveHourUsageLimit is missing", () => {
    expect(
      isSeatStatusOk({
        ok: true,
        balance: {
          weeklyUsageLimit: { label: "week", remainingPercent: 80 },
        },
      })
    ).toBe(false);
  });

  it("returns false when weeklyUsageLimit is missing", () => {
    expect(
      isSeatStatusOk({
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 90 },
        },
      })
    ).toBe(false);
  });

  it("returns false when remainingPercent is NaN", () => {
    expect(
      isSeatStatusOk({
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: NaN },
          weeklyUsageLimit: { label: "week", remainingPercent: 80 },
        },
      })
    ).toBe(false);
  });

  it("returns false when label is not a string", () => {
    expect(
      isSeatStatusOk({
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: 123, remainingPercent: 90 },
          weeklyUsageLimit: { label: "week", remainingPercent: 80 },
        },
      })
    ).toBe(false);
  });

  it("returns true when resetAt is a string", () => {
    expect(
      isSeatStatusOk({
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 90, resetAt: "2025-01-01" },
          weeklyUsageLimit: { label: "week", remainingPercent: 80, resetAt: "2025-01-07" },
        },
      })
    ).toBe(true);
  });

  it("returns false when resetAt is a non-string value", () => {
    expect(
      isSeatStatusOk({
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 90, resetAt: 123 },
          weeklyUsageLimit: { label: "week", remainingPercent: 80 },
        },
      })
    ).toBe(false);
  });
});

describe("isSeatStatusResult", () => {
  it("returns true for a success response", () => {
    expect(
      isSeatStatusResult({
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 90 },
          weeklyUsageLimit: { label: "week", remainingPercent: 80 },
          codeReview: null,
        },
      })
    ).toBe(true);
  });

  it("returns true for an error response", () => {
    expect(isSeatStatusResult({ ok: false, error: "something went wrong" })).toBe(true);
  });

  it("returns false for an error response with non-string error", () => {
    expect(isSeatStatusResult({ ok: false, error: 123 })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isSeatStatusResult(null)).toBe(false);
  });

  it("returns false for a string", () => {
    expect(isSeatStatusResult("hello")).toBe(false);
  });

  it("returns false when ok is missing", () => {
    expect(isSeatStatusResult({ error: "fail" })).toBe(false);
  });
});

describe("isSeatStatusesResponse", () => {
  it("returns true for a valid batch response", () => {
    expect(
      isSeatStatusesResponse({
        ok: true,
        fetchedAt: "2025-01-01T00:00:00Z",
        statuses: {
          "seat-1": {
            ok: true,
            balance: {
              fiveHourUsageLimit: { label: "5h", remainingPercent: 90 },
              weeklyUsageLimit: { label: "week", remainingPercent: 80 },
              codeReview: null,
            },
          },
          "seat-2": { ok: false, error: "failed" },
        },
      })
    ).toBe(true);
  });

  it("returns true for a response with empty statuses", () => {
    expect(
      isSeatStatusesResponse({
        ok: true,
        fetchedAt: "2025-01-01T00:00:00Z",
        statuses: {},
      })
    ).toBe(true);
  });

  it("returns false when ok is not true", () => {
    expect(
      isSeatStatusesResponse({
        ok: false,
        fetchedAt: "2025-01-01T00:00:00Z",
        statuses: {},
      })
    ).toBe(false);
  });

  it("returns false when fetchedAt is missing", () => {
    expect(
      isSeatStatusesResponse({
        ok: true,
        statuses: {},
      })
    ).toBe(false);
  });

  it("returns false when fetchedAt is not a string", () => {
    expect(
      isSeatStatusesResponse({
        ok: true,
        fetchedAt: 12345,
        statuses: {},
      })
    ).toBe(false);
  });

  it("returns false when statuses is not an object", () => {
    expect(
      isSeatStatusesResponse({
        ok: true,
        fetchedAt: "2025-01-01T00:00:00Z",
        statuses: "invalid",
      })
    ).toBe(false);
  });

  it("returns false when a status entry is invalid", () => {
    expect(
      isSeatStatusesResponse({
        ok: true,
        fetchedAt: "2025-01-01T00:00:00Z",
        statuses: {
          "seat-1": { ok: false, error: 123 }, // error must be string
        },
      })
    ).toBe(false);
  });

  it("returns false for null", () => {
    expect(isSeatStatusesResponse(null)).toBe(false);
  });
});

describe("isSeatMetaArray - extended", () => {
  it("returns false when auth_mode is non-string", () => {
    expect(isSeatMetaArray([{ id: "s1", auth_mode: 123 }])).toBe(false);
  });

  it("returns false when last_refresh is non-string", () => {
    expect(isSeatMetaArray([{ id: "s1", last_refresh: true }])).toBe(false);
  });

  it("returns false when error is non-string", () => {
    expect(isSeatMetaArray([{ id: "s1", error: 42 }])).toBe(false);
  });

  it("returns true when optional fields are null", () => {
    expect(isSeatMetaArray([{ id: "s1", auth_mode: null, last_refresh: null, error: null }])).toBe(
      true
    );
  });
});
