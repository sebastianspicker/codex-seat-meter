import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsSection } from "@/components/StatsSection";
import type { DashboardStats } from "@/lib/dashboard-stats";

describe("StatsSection", () => {
  const stats: DashboardStats = {
    activeSeats: 3,
    totalErrors: 1,
    totalCredits: 47.5,
    minRateLimit: 25,
  };

  it("renders all four stat cards", () => {
    render(<StatsSection stats={stats} seatCount={5} />);

    expect(screen.getByText("Active Seats")).toBeInTheDocument();
    expect(screen.getByText("Errors")).toBeInTheDocument();
    expect(screen.getByText("Total Balance")).toBeInTheDocument();
    expect(screen.getByText("Lowest Limit")).toBeInTheDocument();
  });

  it("displays active seat count with total", () => {
    render(<StatsSection stats={stats} seatCount={5} />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("/ 5")).toBeInTheDocument();
  });

  it("displays total credits formatted as dollars", () => {
    render(<StatsSection stats={stats} seatCount={5} />);

    expect(screen.getByText("$47.50")).toBeInTheDocument();
  });

  it("displays lowest limit as percent", () => {
    render(<StatsSection stats={stats} seatCount={5} />);

    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("displays em-dash when minRateLimit is null", () => {
    const nullStats: DashboardStats = { ...stats, minRateLimit: null };
    render(<StatsSection stats={nullStats} seatCount={5} />);

    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });

  it("displays $0.00 when totalCredits is 0", () => {
    const zeroStats: DashboardStats = { ...stats, totalCredits: 0 };
    render(<StatsSection stats={zeroStats} seatCount={5} />);

    expect(screen.getByText("$0.00")).toBeInTheDocument();
  });
});
