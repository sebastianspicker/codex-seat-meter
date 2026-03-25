"use client";

import type { RefObject } from "react";
import { RefreshCw, RotateCcw, Search } from "lucide-react";
import { formatTime } from "@/lib/format";
import type { DashboardFilter, DashboardSort } from "@/types/seat";

interface Props {
  timeStr: string;
  autoRefresh: boolean;
  onAutoRefreshChange: (checked: boolean) => void;
  loading: boolean;
  onRefresh: () => void;
  secret?: string | null;
  lastUpdatedAt?: Date | null;
  intervalMs: number;
  onIntervalMsChange: (intervalMs: number) => void;
  query: string;
  onQueryChange: (query: string) => void;
  filter: DashboardFilter;
  onFilterChange: (filter: DashboardFilter) => void;
  sort: DashboardSort;
  onSortChange: (sort: DashboardSort) => void;
  failedCount: number;
  onRetryFailed: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

const INTERVAL_OPTIONS = [15000, 30000, 60000, 120000] as const;

export function DashboardToolbar({
  timeStr,
  autoRefresh,
  onAutoRefreshChange,
  loading,
  onRefresh,
  secret,
  lastUpdatedAt,
  intervalMs,
  onIntervalMsChange,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  failedCount,
  onRetryFailed,
  searchInputRef,
}: Props) {
  return (
    <div className="sticky top-3 z-30 rounded-xl border border-zinc-800/70 bg-surface-1/80 px-4 py-4 shadow-lg backdrop-blur-md sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 lg:flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search seat id (/)"
                className="data-mono w-full rounded-md border border-zinc-800 bg-surface-2 px-9 py-2 text-xs text-zinc-300 outline-none transition-colors placeholder:text-zinc-600 focus:border-copper/40"
                aria-label="Search seats by id"
              />
            </label>

            <div className="flex flex-1 gap-2">
              <select
                value={filter}
                onChange={(e) => onFilterChange(e.target.value as DashboardFilter)}
                className="data-mono min-w-0 flex-1 rounded-md border border-zinc-800 bg-surface-2 px-2.5 py-2 text-[0.7rem] tracking-wide text-zinc-300 outline-none transition-colors focus:border-copper/40"
                aria-label="Filter seats"
              >
                <option value="all">Filter: All</option>
                <option value="healthy">Filter: Healthy</option>
                <option value="file-error">Filter: File Errors</option>
                <option value="api-error">Filter: API Errors</option>
                <option value="low-limit">Filter: Low Limit (≤25%)</option>
              </select>

              <select
                value={sort}
                onChange={(e) => onSortChange(e.target.value as DashboardSort)}
                className="data-mono min-w-0 flex-1 rounded-md border border-zinc-800 bg-surface-2 px-2.5 py-2 text-[0.7rem] tracking-wide text-zinc-300 outline-none transition-colors focus:border-copper/40"
                aria-label="Sort seats"
              >
                <option value="id">Sort: Seat ID</option>
                <option value="lowest-limit">Sort: Lowest Limit</option>
                <option value="highest-credits">Sort: Highest Credits</option>
                <option value="error-first">Sort: Error First</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="data-mono text-xs tracking-wide text-zinc-500">{timeStr}</span>
            {lastUpdatedAt != null && (
              <span className="data-mono text-[0.625rem] tracking-wide text-zinc-600">
                Last updated {formatTime(lastUpdatedAt)}
              </span>
            )}
            <label className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => onAutoRefreshChange(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-surface-2 text-copper focus-visible:ring-copper/50"
                aria-label="Enable auto-refresh"
              />
              <span className="data-mono text-[0.625rem] tracking-wide text-zinc-400">Auto-refresh</span>
            </label>
            <select
              value={intervalMs}
              onChange={(e) => onIntervalMsChange(Number(e.target.value))}
              className="data-mono rounded-md border border-zinc-800 bg-surface-2 px-2 py-1.5 text-[0.625rem] tracking-wide text-zinc-400 outline-none transition-colors focus:border-copper/40"
              aria-label="Auto-refresh interval"
            >
              {INTERVAL_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  Every {Math.round(value / 1000)}s
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <button
            type="button"
            onClick={onRetryFailed}
            disabled={failedCount === 0 || loading}
            className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-[0.625rem] text-zinc-400 disabled:opacity-30"
            aria-label="Retry failed seats"
          >
            <RotateCcw className="h-3 w-3" />
            Retry failed ({failedCount})
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary group relative flex items-center justify-center gap-2 overflow-hidden px-5 py-2 tracking-wide shadow-sm"
            aria-label="Refresh all seats"
          >
            <RefreshCw
              className={`z-10 h-3.5 w-3.5 ${loading ? "animate-spin text-copper-light" : "text-zinc-500 group-hover:text-copper-light"}`}
            />
            <span className="relative z-10 transition-colors group-hover:text-white">
              {loading ? "Refreshing\u2026" : "Refresh all (r)"}
            </span>
            <span className="absolute inset-0 z-0 bg-copper-faint opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </div>
      </div>
      {secret && (
        <p className="mt-3 text-[0.625rem] text-zinc-500" role="note">
          Secret captured from URL and sent via <code className="px-0.5 font-mono">x-dashboard-secret</code> header.
          The query parameter is removed from the address bar to reduce leak risk.
        </p>
      )}
    </div>
  );
}
