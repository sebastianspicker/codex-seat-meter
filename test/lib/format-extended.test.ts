// @vitest-environment node

import { describe, expect, it } from "vitest";
import { formatDateTime, formatTime } from "@/lib/format";

describe("formatDateTime - edge cases", () => {
  it("returns em-dash for invalid ISO string", () => {
    expect(formatDateTime("not-a-date")).toBe("\u2014");
  });

  it("returns em-dash for empty string", () => {
    expect(formatDateTime("")).toBe("\u2014");
  });

  it("returns em-dash for an invalid Date object", () => {
    expect(formatDateTime(new Date("invalid"))).toBe("\u2014");
  });
});

describe("formatTime - edge cases", () => {
  it("returns em-dash for an invalid Date", () => {
    expect(formatTime(new Date("invalid"))).toBe("\u2014");
  });

  it("returns em-dash for a Date with NaN time", () => {
    expect(formatTime(new Date(NaN))).toBe("\u2014");
  });

  it("returns em-dash for a Date with Infinity time", () => {
    // new Date(Infinity) produces an Invalid Date
    expect(formatTime(new Date(Infinity))).toBe("\u2014");
  });
});
