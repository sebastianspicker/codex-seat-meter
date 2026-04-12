// @vitest-environment node

import { describe, expect, it } from "vitest";
import { filterAndSortSeats } from "@/lib/dashboard-controls";
import type { SeatMeta, StatusState } from "@/types/seat";

describe("filterAndSortSeats", () => {
  const seats: SeatMeta[] = [
    { id: "beta" },
    { id: "alpha", error: "bad file" },
    { id: "gamma" },
  ];

  const statuses: Record<string, StatusState> = {
    beta: {
      state: "ok",
      data: {
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 70 },
          weeklyUsageLimit: { label: "week", remainingPercent: 80 },
          codeReview: null,
        },
        credits: { hasCredits: true, unlimited: false, balance: 10 },
      },
    },
    gamma: {
      state: "error",
      data: { ok: false, error: "upstream" },
    },
  };

  it("filters and sorts error-first", () => {
    const result = filterAndSortSeats({
      seats,
      statuses,
      filter: "api-error",
      sort: "error-first",
      query: "",
    });

    expect(result.map((seat) => seat.id)).toEqual(["gamma"]);
  });

  it("supports text query and lowest-limit sorting", () => {
    const result = filterAndSortSeats({
      seats,
      statuses,
      filter: "all",
      sort: "lowest-limit",
      query: "a",
    });

    expect(result.map((seat) => seat.id)).toEqual(["beta", "alpha", "gamma"]);
  });

  it("handles search with special regex characters as literal text", () => {
    // The search uses string.includes() so regex special chars are treated literally
    const specialSeats: SeatMeta[] = [
      { id: "team.alpha" },
      { id: "team*beta" },
      { id: "team[gamma]" },
      { id: "normal" },
    ];

    const emptyStatuses: Record<string, StatusState> = {};

    // Searching for "." should only match the seat with a literal dot
    const dotResult = filterAndSortSeats({
      seats: specialSeats,
      statuses: emptyStatuses,
      filter: "all",
      sort: "id",
      query: ".",
    });
    expect(dotResult.map((s) => s.id)).toEqual(["team.alpha"]);

    // Searching for "*" should only match the seat with a literal asterisk
    const starResult = filterAndSortSeats({
      seats: specialSeats,
      statuses: emptyStatuses,
      filter: "all",
      sort: "id",
      query: "*",
    });
    expect(starResult.map((s) => s.id)).toEqual(["team*beta"]);

    // Searching for "[" should only match the seat with a literal bracket
    const bracketResult = filterAndSortSeats({
      seats: specialSeats,
      statuses: emptyStatuses,
      filter: "all",
      sort: "id",
      query: "[",
    });
    expect(bracketResult.map((s) => s.id)).toEqual(["team[gamma]"]);
  });

  it("returns empty array when filter yields no results", () => {
    // "healthy" filter requires no error and state "ok"
    const errorOnlySeats: SeatMeta[] = [
      { id: "broken-1", error: "bad file" },
      { id: "broken-2", error: "parse error" },
    ];

    const result = filterAndSortSeats({
      seats: errorOnlySeats,
      statuses: {},
      filter: "healthy",
      sort: "id",
      query: "",
    });

    expect(result).toEqual([]);
  });

  it("returns empty array when text query matches nothing", () => {
    const result = filterAndSortSeats({
      seats,
      statuses,
      filter: "all",
      sort: "id",
      query: "nonexistent-seat-name",
    });

    expect(result).toEqual([]);
  });
});
