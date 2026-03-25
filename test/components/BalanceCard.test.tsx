import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BalanceCardView } from "@/components/BalanceCard";

describe("BalanceCardView", () => {
  it("renders label and remaining percent", () => {
    render(
      <BalanceCardView
        card={{ label: "5 hour usage limit", remainingPercent: 75 }}
      />
    );

    expect(screen.getByText("5 hour usage limit")).toBeInTheDocument();
    expect(screen.getByText("75")).toBeInTheDocument();
    expect(screen.getByText("% remaining")).toBeInTheDocument();
  });

  it("renders resetAt when provided", () => {
    render(
      <BalanceCardView
        card={{
          label: "Weekly limit",
          remainingPercent: 50,
          resetAt: "2025-06-15T10:30:00Z",
        }}
      />
    );

    // The resetAt is formatted using formatDateTime, which includes "resets"
    expect(screen.getByText(/resets/)).toBeInTheDocument();
  });

  it("does not render reset when resetAt is undefined", () => {
    render(
      <BalanceCardView
        card={{ label: "Limit", remainingPercent: 80 }}
      />
    );

    expect(screen.queryByText(/resets/)).not.toBeInTheDocument();
  });

  it("clamps percent at 0 for negative values", () => {
    render(
      <BalanceCardView card={{ label: "Test", remainingPercent: -10 }} />
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("clamps percent at 100 for values over 100", () => {
    render(
      <BalanceCardView card={{ label: "Test", remainingPercent: 150 }} />
    );

    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("handles NaN remainingPercent by clamping to 0", () => {
    render(
      <BalanceCardView card={{ label: "Test", remainingPercent: NaN }} />
    );

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("applies red gradient for very low percent (<=5)", () => {
    const { container } = render(
      <BalanceCardView card={{ label: "Critical", remainingPercent: 3 }} />
    );

    const bar = container.querySelector("[class*='from-warm-red']");
    expect(bar).not.toBeNull();
  });

  it("applies amber gradient for low percent (<=25)", () => {
    const { container } = render(
      <BalanceCardView card={{ label: "Low", remainingPercent: 20 }} />
    );

    const bar = container.querySelector("[class*='from-warm-amber']");
    expect(bar).not.toBeNull();
  });

  it("applies copper gradient for healthy percent (>25)", () => {
    const { container } = render(
      <BalanceCardView card={{ label: "Good", remainingPercent: 60 }} />
    );

    const bar = container.querySelector("[class*='from-copper']");
    expect(bar).not.toBeNull();
  });

  it("applies text color based on percent", () => {
    // Low percent (<=10) should have warm-red text
    render(
      <BalanceCardView card={{ label: "Critical", remainingPercent: 5 }} />
    );

    const value = screen.getByText("5");
    expect(value.className).toContain("text-warm-red");
  });

  it("respects delay prop for animation", () => {
    const { container } = render(
      <BalanceCardView card={{ label: "Test", remainingPercent: 50 }} delay={200} />
    );

    const article = container.querySelector("article");
    expect(article?.style.animationDelay).toBe("200ms");
  });
});
