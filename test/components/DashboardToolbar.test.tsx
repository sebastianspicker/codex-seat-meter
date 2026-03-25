import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardToolbar } from "@/components/DashboardToolbar";
import { createRef } from "react";

function renderToolbar(overrides = {}) {
  const defaultProps = {
    timeStr: "10:30 AM",
    autoRefresh: false,
    onAutoRefreshChange: vi.fn(),
    loading: false,
    onRefresh: vi.fn(),
    secret: null,
    lastUpdatedAt: null,
    intervalMs: 30000,
    onIntervalMsChange: vi.fn(),
    query: "",
    onQueryChange: vi.fn(),
    filter: "all" as const,
    onFilterChange: vi.fn(),
    sort: "id" as const,
    onSortChange: vi.fn(),
    failedCount: 0,
    onRetryFailed: vi.fn(),
    searchInputRef: createRef<HTMLInputElement>(),
    ...overrides,
  };

  return { ...render(<DashboardToolbar {...defaultProps} />), props: defaultProps };
}

describe("DashboardToolbar", () => {
  it("renders time string", () => {
    renderToolbar({ timeStr: "2:45 PM" });
    expect(screen.getByText("2:45 PM")).toBeInTheDocument();
  });

  it("renders search input with placeholder", () => {
    renderToolbar();
    const input = screen.getByLabelText("Search seats by id");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Search seat id (/)");
  });

  it("calls onQueryChange when search text changes", () => {
    const { props } = renderToolbar();
    const input = screen.getByLabelText("Search seats by id");
    fireEvent.change(input, { target: { value: "team" } });
    expect(props.onQueryChange).toHaveBeenCalledWith("team");
  });

  it("renders filter and sort selects", () => {
    renderToolbar();
    expect(screen.getByLabelText("Filter seats")).toBeInTheDocument();
    expect(screen.getByLabelText("Sort seats")).toBeInTheDocument();
  });

  it("calls onFilterChange when filter changes", () => {
    const { props } = renderToolbar();
    const select = screen.getByLabelText("Filter seats");
    fireEvent.change(select, { target: { value: "healthy" } });
    expect(props.onFilterChange).toHaveBeenCalledWith("healthy");
  });

  it("calls onSortChange when sort changes", () => {
    const { props } = renderToolbar();
    const select = screen.getByLabelText("Sort seats");
    fireEvent.change(select, { target: { value: "lowest-limit" } });
    expect(props.onSortChange).toHaveBeenCalledWith("lowest-limit");
  });

  it("renders auto-refresh checkbox", () => {
    renderToolbar({ autoRefresh: true });
    const checkbox = screen.getByLabelText("Enable auto-refresh");
    expect(checkbox).toBeChecked();
  });

  it("calls onAutoRefreshChange when checkbox toggles", () => {
    const { props } = renderToolbar();
    const checkbox = screen.getByLabelText("Enable auto-refresh");
    fireEvent.click(checkbox);
    expect(props.onAutoRefreshChange).toHaveBeenCalledWith(true);
  });

  it("renders interval select with correct value", () => {
    renderToolbar({ intervalMs: 60000 });
    const select = screen.getByLabelText("Auto-refresh interval");
    expect(select).toHaveValue("60000");
  });

  it("calls onIntervalMsChange when interval changes", () => {
    const { props } = renderToolbar();
    const select = screen.getByLabelText("Auto-refresh interval");
    fireEvent.change(select, { target: { value: "120000" } });
    expect(props.onIntervalMsChange).toHaveBeenCalledWith(120000);
  });

  it("renders refresh all button", () => {
    renderToolbar();
    expect(screen.getByLabelText("Refresh all seats")).toBeInTheDocument();
    expect(screen.getByText(/Refresh all/)).toBeInTheDocument();
  });

  it("calls onRefresh when refresh button clicked", () => {
    const { props } = renderToolbar();
    fireEvent.click(screen.getByLabelText("Refresh all seats"));
    expect(props.onRefresh).toHaveBeenCalled();
  });

  it("disables refresh button when loading", () => {
    renderToolbar({ loading: true });
    expect(screen.getByLabelText("Refresh all seats")).toBeDisabled();
    expect(screen.getByText(/Refreshing/)).toBeInTheDocument();
  });

  it("renders retry failed button with count", () => {
    renderToolbar({ failedCount: 3 });
    const btn = screen.getByLabelText("Retry failed seats");
    expect(btn).toBeInTheDocument();
    expect(screen.getByText("Retry failed (3)")).toBeInTheDocument();
  });

  it("disables retry button when failedCount is 0", () => {
    renderToolbar({ failedCount: 0 });
    expect(screen.getByLabelText("Retry failed seats")).toBeDisabled();
  });

  it("calls onRetryFailed when retry button clicked", () => {
    const { props } = renderToolbar({ failedCount: 2 });
    fireEvent.click(screen.getByLabelText("Retry failed seats"));
    expect(props.onRetryFailed).toHaveBeenCalled();
  });

  it("shows last updated time when provided", () => {
    const date = new Date("2025-06-15T14:30:00Z");
    renderToolbar({ lastUpdatedAt: date });
    expect(screen.getByText(/Last updated/)).toBeInTheDocument();
  });

  it("does not show last updated when null", () => {
    renderToolbar({ lastUpdatedAt: null });
    expect(screen.queryByText(/Last updated/)).not.toBeInTheDocument();
  });

  it("shows secret note when secret is provided", () => {
    renderToolbar({ secret: "my-secret" });
    expect(screen.getByRole("note")).toBeInTheDocument();
    expect(screen.getByText(/x-dashboard-secret/)).toBeInTheDocument();
  });

  it("does not show secret note when secret is null", () => {
    renderToolbar({ secret: null });
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});
