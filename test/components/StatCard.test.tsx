import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "@/components/StatCard";

describe("StatCard", () => {
  it("renders label, value, and icon", () => {
    render(
      <StatCard
        icon={<span data-testid="icon">ic</span>}
        label="Active Seats"
        value={5}
      />
    );

    expect(screen.getByText("Active Seats")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders subValue when provided", () => {
    render(
      <StatCard
        icon={<span>ic</span>}
        label="Seats"
        value={5}
        subValue="/ 10"
      />
    );

    expect(screen.getByText("/ 10")).toBeInTheDocument();
  });

  it("renders bar when barPercent is provided", () => {
    const { container } = render(
      <StatCard
        icon={<span>ic</span>}
        label="Limit"
        value="50%"
        barPercent={50}
      />
    );

    const bar = container.querySelector("[style*='width']");
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute("style")).toContain("50%");
  });

  it("does not render bar when barPercent is null", () => {
    const { container } = render(
      <StatCard
        icon={<span>ic</span>}
        label="Limit"
        value="N/A"
        barPercent={null}
      />
    );

    // The main container may have a style, but the absolute bar div should not exist
    const bars = container.querySelectorAll(".absolute.bottom-0");
    expect(bars.length).toBe(0);
  });

  it("clamps barPercent to 0-100 range", () => {
    const { container } = render(
      <StatCard
        icon={<span>ic</span>}
        label="Over"
        value="150%"
        barPercent={150}
      />
    );

    const bar = container.querySelector("[style*='width']");
    expect(bar?.getAttribute("style")).toContain("100%");
  });

  it("applies error variant styling", () => {
    render(
      <StatCard
        icon={<span>ic</span>}
        label="Errors"
        value={3}
        valueVariant="error"
      />
    );

    const valueEl = screen.getByText("3");
    expect(valueEl.className).toContain("text-warm-red");
  });

  it("applies muted variant styling", () => {
    render(
      <StatCard
        icon={<span>ic</span>}
        label="Errors"
        value={0}
        valueVariant="muted"
      />
    );

    const valueEl = screen.getByText("0");
    expect(valueEl.className).toContain("text-zinc-500");
  });

  it("applies custom className", () => {
    const { container } = render(
      <StatCard
        icon={<span>ic</span>}
        label="Test"
        value="val"
        className="custom-cls"
      />
    );

    const card = container.firstElementChild;
    expect(card?.className).toContain("custom-cls");
  });
});
