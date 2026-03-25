import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SeatCard } from "@/components/SeatCard";
import type { SeatMeta, StatusState } from "@/types/seat";

describe("SeatCard", () => {
  const onRefresh = vi.fn();

  const baseSeat: SeatMeta = {
    id: "team-alpha",
    auth_mode: "chatgpt",
    last_refresh: "2025-06-15T10:30:00Z",
  };

  const okStatus: StatusState = {
    state: "ok",
    data: {
      ok: true,
      balance: {
        fiveHourUsageLimit: { label: "5 hour usage limit", remainingPercent: 75, resetAt: "2025-06-15T15:30:00Z" },
        weeklyUsageLimit: { label: "Weekly usage limit", remainingPercent: 90, resetAt: "2025-06-22T10:30:00Z" },
        codeReview: null,
      },
      planType: "pro",
      credits: { hasCredits: true, unlimited: false, balance: 12.5 },
    },
  };

  it("renders seat id as heading", () => {
    render(<SeatCard seat={baseSeat} status={okStatus} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText("team-alpha")).toBeInTheDocument();
  });

  it("renders auth_mode and last refresh", () => {
    render(<SeatCard seat={baseSeat} status={okStatus} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText(/chatgpt/)).toBeInTheDocument();
  });

  it("renders balance cards when status is ok", () => {
    render(<SeatCard seat={baseSeat} status={okStatus} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText("5 hour usage limit")).toBeInTheDocument();
    expect(screen.getByText("Weekly usage limit")).toBeInTheDocument();
  });

  it("renders plan type badge when available", () => {
    render(<SeatCard seat={baseSeat} status={okStatus} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText("pro")).toBeInTheDocument();
  });

  it("renders credits balance", () => {
    render(<SeatCard seat={baseSeat} status={okStatus} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText("$12.50")).toBeInTheDocument();
  });

  it("renders refresh button and calls onRefresh", () => {
    render(<SeatCard seat={baseSeat} status={okStatus} index={0} onRefresh={onRefresh} />);

    const refreshBtn = screen.getByLabelText(`Refresh usage for ${baseSeat.id}`);
    fireEvent.click(refreshBtn);
    expect(onRefresh).toHaveBeenCalled();
  });

  it("renders loading state", () => {
    const loadingStatus: StatusState = { state: "loading" };
    render(<SeatCard seat={baseSeat} status={loadingStatus} index={0} onRefresh={onRefresh} />);

    const section = screen.getByLabelText(`Seat ${baseSeat.id} usage status`);
    expect(section).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Refreshing")).toBeInTheDocument();
  });

  it("renders idle state as loading", () => {
    const idleStatus: StatusState = { state: "idle" };
    render(<SeatCard seat={baseSeat} status={idleStatus} index={0} onRefresh={onRefresh} />);

    const section = screen.getByLabelText(`Seat ${baseSeat.id} usage status`);
    expect(section).toHaveAttribute("aria-busy", "true");
  });

  it("renders error state with error message", () => {
    const errorStatus: StatusState = {
      state: "error",
      data: { ok: false, error: "Token expired" },
    };
    render(<SeatCard seat={baseSeat} status={errorStatus} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText("API Error")).toBeInTheDocument();
    expect(screen.getByText("Token expired")).toBeInTheDocument();
  });

  it("renders file error from seat metadata", () => {
    const errorSeat: SeatMeta = { id: "broken", error: "Invalid JSON format" };
    render(<SeatCard seat={errorSeat} status={{ state: "idle" }} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText("Parse Error")).toBeInTheDocument();
    expect(screen.getByText("Invalid JSON format")).toBeInTheDocument();
  });

  it("hides refresh button when seat has file error", () => {
    const errorSeat: SeatMeta = { id: "broken", error: "bad" };
    render(<SeatCard seat={errorSeat} status={{ state: "idle" }} index={0} onRefresh={onRefresh} />);

    expect(screen.queryByLabelText(/Refresh usage/)).not.toBeInTheDocument();
  });

  it("applies animation delay based on index", () => {
    const { container } = render(
      <SeatCard seat={baseSeat} status={okStatus} index={2} onRefresh={onRefresh} />
    );

    const section = container.querySelector("section");
    expect(section?.style.animationDelay).toBe("160ms");
  });

  it("renders em-dash when auth_mode is not present", () => {
    const noAuthSeat: SeatMeta = { id: "no-auth" };
    render(<SeatCard seat={noAuthSeat} status={okStatus} index={0} onRefresh={onRefresh} />);

    // The component renders seat.auth_mode ?? "\u2014"
    expect(screen.getByText(/\u2014/)).toBeInTheDocument();
  });

  it("renders unlimited credits text", () => {
    const unlimitedStatus: StatusState = {
      state: "ok",
      data: {
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 75 },
          weeklyUsageLimit: { label: "week", remainingPercent: 90 },
          codeReview: null,
        },
        credits: { hasCredits: true, unlimited: true },
      },
    };
    render(<SeatCard seat={baseSeat} status={unlimitedStatus} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText("unlimited")).toBeInTheDocument();
  });

  it("renders 'no credits' text when hasCredits is false", () => {
    const noCreditsStatus: StatusState = {
      state: "ok",
      data: {
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 75 },
          weeklyUsageLimit: { label: "week", remainingPercent: 90 },
          codeReview: null,
        },
        credits: { hasCredits: false, unlimited: false },
      },
    };
    render(<SeatCard seat={baseSeat} status={noCreditsStatus} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText("no credits")).toBeInTheDocument();
  });

  it("renders 'credits' text when hasCredits is true but balance is undefined", () => {
    const creditsNoBalance: StatusState = {
      state: "ok",
      data: {
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 75 },
          weeklyUsageLimit: { label: "week", remainingPercent: 90 },
          codeReview: null,
        },
        credits: { hasCredits: true, unlimited: false },
      },
    };
    render(<SeatCard seat={baseSeat} status={creditsNoBalance} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText("credits")).toBeInTheDocument();
  });

  it("renders code review balance card when present", () => {
    const withCodeReview: StatusState = {
      state: "ok",
      data: {
        ok: true,
        balance: {
          fiveHourUsageLimit: { label: "5h", remainingPercent: 75 },
          weeklyUsageLimit: { label: "week", remainingPercent: 90 },
          codeReview: { label: "Code Review", remainingPercent: 50 },
        },
      },
    };
    render(<SeatCard seat={baseSeat} status={withCodeReview} index={0} onRefresh={onRefresh} />);

    expect(screen.getByText("Code Review")).toBeInTheDocument();
  });
});
