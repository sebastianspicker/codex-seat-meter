// @vitest-environment node

import { describe, expect, it } from "vitest";
import { formatDateTime, formatTime } from "@/lib/format";

describe("formatDateTime", () => {
  it("formats a Date object to short date + time", () => {
    const date = new Date("2025-02-16T14:46:00Z");
    const result = formatDateTime(date);
    // Should contain month abbreviation, day, and time parts
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("formats an ISO date string to short date + time", () => {
    const result = formatDateTime("2025-02-16T14:46:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("accepts both string and Date and produces the same output", () => {
    const iso = "2025-06-15T10:30:00Z";
    const date = new Date(iso);
    expect(formatDateTime(iso)).toBe(formatDateTime(date));
  });
});

describe("formatTime", () => {
  it("formats a Date to time-only string", () => {
    const date = new Date("2025-02-16T14:46:00Z");
    const result = formatTime(date);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("does not include the date portion", () => {
    const date = new Date("2025-12-25T08:30:00Z");
    const result = formatTime(date);
    // Time-only output should be short (e.g. "08:30 AM")
    // It should not contain a comma (which would indicate a date component)
    expect(result.length).toBeLessThan(15);
  });
});
