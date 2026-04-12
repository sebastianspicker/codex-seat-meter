import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingDots } from "@/components/LoadingDots";

describe("LoadingDots", () => {
  it("renders with status role and aria-busy", () => {
    render(<LoadingDots />);

    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute("aria-busy", "true");
  });

  it("renders message when provided", () => {
    render(<LoadingDots message="Loading data..." />);

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("does not render message text when not provided", () => {
    const { container } = render(<LoadingDots />);

    const p = container.querySelector("p");
    expect(p).toBeNull();
  });

  it("applies custom className", () => {
    render(<LoadingDots className="my-class" />);

    const status = screen.getByRole("status");
    expect(status.className).toContain("my-class");
  });

  it("applies sm size class", () => {
    const { container } = render(<LoadingDots size="sm" />);
    const svg = container.querySelector("svg");
    expect(svg?.classList.toString()).toContain("h-3.5");
  });

  it("applies md size class by default", () => {
    const { container } = render(<LoadingDots />);
    const svg = container.querySelector("svg");
    expect(svg?.classList.toString()).toContain("h-5");
  });
});
