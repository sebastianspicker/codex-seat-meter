"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SeatCard, type StatusState } from "@/components/SeatCard";
import { LoadingDots } from "@/components/LoadingDots";
import { EmptyState } from "@/components/EmptyState";
import { isSeatMetaArray } from "@/types/seat";
import type { SeatMeta } from "@/types/seat";
import { getErrorMessage } from "@/lib/errors";
import { formatTime } from "@/lib/format";
import { Users, ServerCrash, CreditCard, Activity, RefreshCw } from "lucide-react";

const AUTO_REFRESH_INTERVAL_MS = 60_000;

export default function Home() {
  const [seats, setSeats] = useState<SeatMeta[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, StatusState>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchSeats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seats");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data: unknown = await res.json();
      if (!isSeatMetaArray(data)) {
        throw new Error("Unexpected response format from /api/seats");
      }
      setSeats(data);
      // We don't clear statuses here so that the UI doesn't flash empty during refresh.
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load seats"));
      setSeats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  useEffect(() => {
    const update = () => setTimeStr(formatTime(new Date()));
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!autoRefresh || !seats?.length) return;
    const id = setInterval(fetchSeats, AUTO_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [autoRefresh, seats?.length, fetchSeats]);

  const handleStatusUpdate = useCallback((id: string, status: StatusState) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  }, []);

  // Compute Global Stats
  const stats = useMemo(() => {
    if (!seats) return null;
    let totalCredits = 0;
    let minRateLimit = 100;
    let okCount = 0;

    // File errors are counted synchronously from SeatMeta array
    const fileErrorCount = seats.filter((s) => s.error).length;
    let apiErrorCount = 0;

    Object.values(statuses).forEach((s) => {
      if (s.state === "ok") {
        okCount++;
        if (s.data.credits?.balance) totalCredits += s.data.credits.balance;
        const p1 = s.data.balance.fiveHourUsageLimit.remainingPercent;
        const p2 = s.data.balance.weeklyUsageLimit.remainingPercent;
        minRateLimit = Math.min(minRateLimit, p1, p2);
      } else if (s.state === "error") {
        apiErrorCount++;
      }
    });

    const activeSeats = okCount;
    const totalErrors = fileErrorCount + apiErrorCount;

    return {
      activeSeats,
      totalErrors,
      totalCredits,
      minRateLimit: activeSeats === 0 ? null : minRateLimit,
    };
  }, [seats, statuses]);

  return (
    <main className="min-h-screen px-6 py-10 md:px-12 lg:px-20 relative overflow-hidden">
      <div className="mx-auto max-w-5xl relative z-10">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="label-caps mb-2 tracking-widest text-copper-dark drop-shadow-sm">
                Monitoring Dashboard
              </p>
              <h1 className="font-serif text-3xl font-medium tracking-tight text-white placeholder-glow md:text-4xl">
                Codex Seat Meter
              </h1>
            </div>
            <div className="hidden items-end gap-6 sm:flex">
              <span className="data-mono text-xs tracking-wide text-zinc-500">{timeStr}</span>
              <label className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-600 bg-surface-2 text-copper focus-visible:ring-copper/50"
                />
                <span className="data-mono text-[0.625rem] tracking-wide text-zinc-400">
                  Auto (60s)
                </span>
              </label>
              <button
                type="button"
                onClick={fetchSeats}
                disabled={loading}
                className="btn-secondary group relative flex items-center gap-2 overflow-hidden px-5 py-2 tracking-wide shadow-sm"
                aria-label="Refresh all seats"
              >
                <RefreshCw className={`h-3.5 w-3.5 z-10 ${loading ? "animate-spin text-copper-light" : "text-zinc-500 group-hover:text-copper-light"}`} />
                <span className="relative z-10 transition-colors group-hover:text-white">
                  {loading ? "Refreshing" : "Refresh all"}
                </span>
                <span className="absolute inset-0 z-0 bg-copper-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-copper/30 via-copper/5 to-transparent shadow-[0_1px_10px_rgba(200,149,108,0.2)]" />
        </header>

        {/* Mobile refresh */}
        <div className="mb-6 flex flex-col gap-3 sm:hidden">
          <button
            type="button"
            onClick={fetchSeats}
            disabled={loading}
            className="btn-secondary flex items-center justify-center gap-2 w-full py-3"
            aria-label="Refresh all seats"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-copper-light" : "text-zinc-500"}`} />
            <span className={loading ? "text-copper-light" : ""}>{loading ? "Refreshing\u2026" : "Refresh all seats"}</span>
          </button>
          <label className="flex cursor-pointer items-center justify-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-600 bg-surface-2 text-copper focus-visible:ring-copper/50"
            />
            <span className="data-mono text-xs tracking-wide text-zinc-400">
              Auto-refresh every 60s
            </span>
          </label>
        </div>

        {/* Global Stats Section */}
        {stats && seats && seats.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-fade-up">
            <div className="glass-card rounded-xl border border-zinc-800/40 p-5 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-4 w-4 text-copper-light" />
                <h3 className="label-caps">Active Seats</h3>
              </div>
              <p className="data-mono text-2xl font-semibold text-white">
                {stats.activeSeats} <span className="text-sm font-normal text-zinc-600">/ {seats.length}</span>
              </p>
            </div>

            <div className="glass-card rounded-xl border border-zinc-800/40 p-5 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2">
                <ServerCrash className={stats.totalErrors > 0 ? "h-4 w-4 text-warm-red" : "h-4 w-4 text-zinc-500"} />
                <h3 className="label-caps">Errors</h3>
              </div>
              <p className={`data-mono text-2xl font-semibold ${stats.totalErrors > 0 ? "text-warm-red" : "text-zinc-500"}`}>
                {stats.totalErrors}
              </p>
            </div>

            <div className="glass-card rounded-xl border border-zinc-800/40 p-5 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="h-4 w-4 text-copper-light" />
                <h3 className="label-caps">Total Balance</h3>
              </div>
              <p className="data-mono text-2xl font-semibold text-white tracking-tight">
                ${stats.totalCredits.toFixed(2)}
              </p>
            </div>

            <div className="glass-card relative overflow-hidden rounded-xl border border-zinc-800/40 p-5 shadow-lg backdrop-blur-md">
              <div className="relative z-10 flex items-center gap-3 mb-2">
                <Activity className="h-4 w-4 text-copper-light" />
                <h3 className="label-caps">Lowest Limit</h3>
              </div>
              <p className="relative z-10 data-mono text-2xl font-semibold text-white">
                {stats.minRateLimit !== null ? `${stats.minRateLimit}%` : "\u2014"}
              </p>
              {stats.minRateLimit !== null && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-warm-amber to-copper-light"
                  style={{ width: `${stats.minRateLimit}%` }}
                />
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="animate-fade-up mb-8 flex items-start gap-3 rounded-lg border border-warm-red/20 bg-warm-red/5 px-5 py-4 shadow-inner">
            <ServerCrash className="h-5 w-5 shrink-0 text-warm-red/80" />
            <div>
              <p className="label-caps mb-1 text-warm-red">System Error</p>
              <p className="text-sm tracking-wide text-warm-red/80">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        {loading && !seats ? (
          <LoadingDots
            message="Establishing connection&hellip;"
            className="py-24"
          />
        ) : seats && seats.length === 0 ? (
          <EmptyState
            title="No seats detected"
            description={
              <>
                Set{" "}
                <code className="rounded bg-surface-3/80 px-1.5 py-0.5 font-mono text-copper-dark shadow-inner">
                  SEATS_DIRECTORY
                </code>{" "}
                to a folder containing auth JSON files.
              </>
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            {seats?.map((seat, i) => (
              <SeatCard
                key={seat.id}
                seat={seat}
                refreshKey={refreshKey}
                index={i}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-20 flex items-center justify-between border-t border-zinc-800/50 pt-8 pb-4">
          <div className="flex items-center gap-3">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-copper-dark shadow-[0_0_8px_rgba(166,121,82,0.8)]" />
            <p className="text-[0.6875rem] tracking-wider text-zinc-600 uppercase font-medium">
              Codex Seat Meter
            </p>
          </div>
          <p className="text-[0.625rem] tracking-wide text-zinc-700">
            Local Instance &middot; Tokens stay on server
          </p>
        </footer>
      </div>
    </main>
  );
}
