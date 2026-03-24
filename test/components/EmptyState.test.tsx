import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "@/components/EmptyState";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState title="No results" description="Try adjusting your filters" />
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("No results")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument();
  });

  it("renders description as ReactNode", () => {
    render(
      <EmptyState title="Empty" description={<a href="/help">Get help</a>} />
    );

    expect(screen.getByText("Get help")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(
      <EmptyState title="Empty" description="desc" className="my-custom" />
    );

    const status = screen.getByRole("status");
    expect(status.className).toContain("my-custom");
  });
});
