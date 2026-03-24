// @vitest-environment node

import { describe, expect, it } from "vitest";
import { getMockSeatStatus, MOCK_SEATS } from "@/lib/demo-data";

describe("MOCK_SEATS", () => {
  it("contains three predefined seats", () => {
    expect(MOCK_SEATS).toHaveLength(3);
    expect(MOCK_SEATS.map((s) => s.id)).toEqual(["personal", "team-alpha", "team-beta"]);
  });

  it("each seat has auth_mode and last_refresh", () => {
    for (const seat of MOCK_SEATS) {
      expect(seat.auth_mode).toBe("chatgpt");
      expect(typeof seat.last_refresh).toBe("string");
    }
  });
});

describe("getMockSeatStatus", () => {
  it("returns ok:true for known seat ids", () => {
    for (const seat of MOCK_SEATS) {
      const result = getMockSeatStatus(seat.id);
      expect(result.ok).toBe(true);
      expect(result.balance).toBeDefined();
      expect(result.balance.fiveHourUsageLimit).toBeDefined();
      expect(result.balance.weeklyUsageLimit).toBeDefined();
    }
  });

  it("returns varied data per known seat", () => {
    const personal = getMockSeatStatus("personal");
    const teamAlpha = getMockSeatStatus("team-alpha");
    const teamBeta = getMockSeatStatus("team-beta");

    // personal has 72% fiveHour, 88% weekly
    expect(personal.balance.fiveHourUsageLimit.remainingPercent).toBe(72);
    expect(personal.balance.weeklyUsageLimit.remainingPercent).toBe(88);
    expect(personal.planType).toBe("pro");
    expect(personal.credits?.balance).toBe(12.5);
    expect(personal.credits?.hasCredits).toBe(true);

    // team-alpha has 45% fiveHour, 60% weekly, 0 credits
    expect(teamAlpha.balance.fiveHourUsageLimit.remainingPercent).toBe(45);
    expect(teamAlpha.balance.weeklyUsageLimit.remainingPercent).toBe(60);
    expect(teamAlpha.planType).toBe("team");
    expect(teamAlpha.credits?.hasCredits).toBe(false);

    // team-beta has 100% fiveHour, 100% weekly
    expect(teamBeta.balance.fiveHourUsageLimit.remainingPercent).toBe(100);
    expect(teamBeta.balance.weeklyUsageLimit.remainingPercent).toBe(100);
    expect(teamBeta.credits?.balance).toBe(25);
  });

  it("returns default values for unknown seat ids", () => {
    const result = getMockSeatStatus("unknown-seat");
    expect(result.ok).toBe(true);
    expect(result.balance.fiveHourUsageLimit.remainingPercent).toBe(80);
    expect(result.balance.weeklyUsageLimit.remainingPercent).toBe(70);
    expect(result.planType).toBe("pro");
    expect(result.credits?.balance).toBe(10);
  });

  it("includes valid ISO date strings for resetAt", () => {
    const result = getMockSeatStatus("personal");
    const fiveHourReset = result.balance.fiveHourUsageLimit.resetAt;
    const weeklyReset = result.balance.weeklyUsageLimit.resetAt;

    expect(fiveHourReset).toBeDefined();
    expect(weeklyReset).toBeDefined();
    expect(new Date(fiveHourReset!).getTime()).not.toBeNaN();
    expect(new Date(weeklyReset!).getTime()).not.toBeNaN();
  });

  it("sets codeReview to null", () => {
    const result = getMockSeatStatus("personal");
    expect(result.balance.codeReview).toBeNull();
  });

  it("sets unlimited to false for all seats", () => {
    for (const seat of MOCK_SEATS) {
      const result = getMockSeatStatus(seat.id);
      expect(result.credits?.unlimited).toBe(false);
    }
  });
});
