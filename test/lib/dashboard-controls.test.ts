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
});
