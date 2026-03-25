// @vitest-environment node

import { describe, expect, it } from "vitest";
import { filterAndSortSeats } from "@/lib/dashboard-controls";
import type { SeatMeta, StatusState } from "@/types/seat";

describe("filterAndSortSeats - additional coverage", () => {
  const seats: SeatMeta[] = [
    { id: "alpha" },
    { id: "beta" },
    { id: "gamma", error: "file parse error" },
    { id: "delta" },
  ];

  const statuses: Record<string, StatusState> = {
    alpha: {
      state: "ok",
      data: {
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 20 },
          weeklyUsageLimit: { label: "week", remainingPercent: 60 },
          codeReview: null,
        },
        credits: { hasCredits: true, unlimited: false, balance: 50 },
      },
    },
    beta: {
      state: "ok",
      data: {
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 90 },
          weeklyUsageLimit: { label: "week", remainingPercent: 95 },
          codeReview: null,
        },
        credits: { hasCredits: true, unlimited: false, balance: 5 },
      },
    },
    delta: {
      state: "error",
      data: { ok: false, error: "upstream error" },
    },
  };

  describe("filter = file-error", () => {
    it("returns only seats with file errors", () => {
      const result = filterAndSortSeats({
        seats,
        statuses,
        filter: "file-error",
        sort: "id",
        query: "",
      });
      expect(result.map((s) => s.id)).toEqual(["gamma"]);
    });
  });

  describe("filter = healthy", () => {
    it("returns seats without errors and with ok state", () => {
      const result = filterAndSortSeats({
        seats,
        statuses,
        filter: "healthy",
        sort: "id",
        query: "",
      });
      expect(result.map((s) => s.id)).toEqual(["alpha", "beta"]);
    });
  });

  describe("filter = low-limit", () => {
    it("returns seats with remaining percent <= 25", () => {
      const result = filterAndSortSeats({
        seats,
        statuses,
        filter: "low-limit",
        sort: "id",
        query: "",
      });
      // alpha has 20% fiveHour which is <= 25
      expect(result.map((s) => s.id)).toEqual(["alpha"]);
    });
  });

  describe("sort = highest-credits", () => {
    it("sorts seats by credits descending", () => {
      const result = filterAndSortSeats({
        seats,
        statuses,
        filter: "all",
        sort: "highest-credits",
        query: "",
      });
      // alpha=50, beta=5, gamma=null, delta=null
      expect(result.map((s) => s.id)).toEqual(["alpha", "beta", "delta", "gamma"]);
    });
  });

  describe("sort = error-first", () => {
    it("sorts seats with errors first", () => {
      const result = filterAndSortSeats({
        seats,
        statuses,
        filter: "all",
        sort: "error-first",
        query: "",
      });
      // delta has api error, gamma has file error
      expect(result.at(0)?.id).toBe("delta");
      expect(result.at(1)?.id).toBe("gamma");
    });
  });

  describe("sort = lowest-limit", () => {
    it("sorts seats by lowest remaining percent ascending", () => {
      const result = filterAndSortSeats({
        seats,
        statuses,
        filter: "all",
        sort: "lowest-limit",
        query: "",
      });
      // alpha has min 20%, beta has min 90%, gamma/delta have null -> 101
      expect(result.at(0)?.id).toBe("alpha");
      expect(result.at(1)?.id).toBe("beta");
    });
  });

  describe("sort = id (default)", () => {
    it("sorts alphabetically", () => {
      const result = filterAndSortSeats({
        seats,
        statuses,
        filter: "all",
        sort: "id",
        query: "",
      });
      expect(result.map((s) => s.id)).toEqual(["alpha", "beta", "delta", "gamma"]);
    });
  });

  describe("query filtering", () => {
    it("filters case-insensitively", () => {
      const result = filterAndSortSeats({
        seats,
        statuses,
        filter: "all",
        sort: "id",
        query: "ALPHA",
      });
      expect(result.map((s) => s.id)).toEqual(["alpha"]);
    });

    it("trims whitespace from query", () => {
      const result = filterAndSortSeats({
        seats,
        statuses,
        filter: "all",
        sort: "id",
        query: "  beta  ",
      });
      expect(result.map((s) => s.id)).toEqual(["beta"]);
    });
  });

  describe("combined filter and sort", () => {
    it("filters then sorts correctly", () => {
      const result = filterAndSortSeats({
        seats,
        statuses,
        filter: "healthy",
        sort: "lowest-limit",
        query: "",
      });
      expect(result.map((s) => s.id)).toEqual(["alpha", "beta"]);
    });
  });

  describe("edge cases for getMinRemaining / getCredits", () => {
    it("handles status with non-ok state for lowest-limit sort", () => {
      const onlyErrorSeats: SeatMeta[] = [{ id: "err-1" }, { id: "err-2" }];
      const errorStatuses: Record<string, StatusState> = {
        "err-1": { state: "error", data: { ok: false, error: "e1" } },
        "err-2": { state: "loading" },
      };

      const result = filterAndSortSeats({
        seats: onlyErrorSeats,
        statuses: errorStatuses,
        filter: "all",
        sort: "lowest-limit",
        query: "",
      });
      // Both have null min remaining -> 101, sorted alphabetically
      expect(result.map((s) => s.id)).toEqual(["err-1", "err-2"]);
    });

    it("handles status with non-ok state for highest-credits sort", () => {
      const onlyErrorSeats: SeatMeta[] = [{ id: "err-1" }, { id: "err-2" }];
      const errorStatuses: Record<string, StatusState> = {
        "err-1": { state: "error", data: { ok: false, error: "e1" } },
        "err-2": { state: "idle" },
      };

      const result = filterAndSortSeats({
        seats: onlyErrorSeats,
        statuses: errorStatuses,
        filter: "all",
        sort: "highest-credits",
        query: "",
      });
      expect(result.map((s) => s.id)).toEqual(["err-1", "err-2"]);
    });
  });
});
