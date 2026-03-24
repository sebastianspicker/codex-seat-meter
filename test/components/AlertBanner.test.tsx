import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlertBanner } from "@/components/AlertBanner";

describe("AlertBanner", () => {
  it("renders with title and children", () => {
    render(
      <AlertBanner icon={<span data-testid="icon">!</span>} title="Error Occurred">
        <p>Something went wrong</p>
      </AlertBanner>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Error Occurred")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    render(
      <AlertBanner icon={<span>!</span>} title="Default">
        <p>content</p>
      </AlertBanner>
    );

    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("rounded-lg");
  });

  it("applies compact variant classes", () => {
    render(
      <AlertBanner icon={<span>!</span>} title="Compact" variant="compact">
        <p>content</p>
      </AlertBanner>
    );

    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("rounded-md");
  });

  it("applies custom className", () => {
    render(
      <AlertBanner icon={<span>!</span>} title="Custom" className="extra-class">
        <p>content</p>
      </AlertBanner>
    );

    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("extra-class");
  });
});
