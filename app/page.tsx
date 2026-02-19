"use client";

import { useState, useEffect, useCallback } from "react";
import { SeatCard } from "@/components/SeatCard";
import { LoadingDots } from "@/components/LoadingDots";
import { EmptyState } from "@/components/EmptyState";
import { isSeatMetaArray } from "@/types/seat";
import type { SeatMeta } from "@/types/seat";
import { getErrorMessage } from "@/lib/errors";
import { formatTime } from "@/lib/format";

const AUTO_REFRESH_INTERVAL_MS = 60_000;

export default function Home() {
  const [seats, setSeats] = useState<SeatMeta[] | null>(null);
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

  return (
    <main className="min-h-screen px-6 py-10 md:px-12 lg:px-20">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-12 flex flex-col gap-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="label-caps mb-2 tracking-widest text-copper-dark">
                Monitoring Dashboard
              </p>
              <h1 className="font-serif text-3xl font-medium tracking-tight text-zinc-100 md:text-4xl">
                Codex Seat Meter
              </h1>
            </div>
            <div className="hidden items-end gap-6 sm:flex">
              <span className="data-mono text-xs text-zinc-600">{timeStr}</span>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-600 bg-surface-2 text-copper focus-visible:ring-copper/50"
                />
                <span className="data-mono text-[0.625rem] text-zinc-600">
                  Auto (60s)
                </span>
              </label>
              <button
                type="button"
                onClick={fetchSeats}
                disabled={loading}
                className="btn-secondary group relative overflow-hidden px-4 tracking-wide"
                aria-label="Refresh all seats"
              >
                <span className="relative z-10">
                  {loading ? "Querying\u2026" : "Refresh all"}
                </span>
                <span className="absolute inset-0 -z-0 bg-copper-faint opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-copper/20 via-copper/5 to-transparent" />
        </header>

        {/* Mobile refresh */}
        <div className="mb-6 flex flex-col gap-3 sm:hidden">
          <button
            type="button"
            onClick={fetchSeats}
            disabled={loading}
            className="btn-secondary w-full py-2.5"
            aria-label="Refresh all seats"
          >
            {loading ? "Querying\u2026" : "Refresh all seats"}
          </button>
          <label className="flex cursor-pointer items-center justify-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-600 bg-surface-2 text-copper focus-visible:ring-copper/50"
            />
            <span className="data-mono text-xs text-zinc-600">
              Auto-refresh every 60s
            </span>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div className="animate-fade-up mb-8 rounded-lg border border-warm-red/20 bg-warm-red/5 px-5 py-4">
            <p className="label-caps mb-1 text-warm-red">Error</p>
            <p className="text-sm text-warm-red/80">{error}</p>
          </div>
        )}

        {/* Content */}
        {loading && !seats ? (
          <LoadingDots
            message="Establishing connection&hellip;"
            className="py-20"
          />
        ) : seats && seats.length === 0 ? (
          <EmptyState
            title="No seats detected"
            description={
              <>
                Set{" "}
                <code className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-copper-dark">
                  SEATS_DIRECTORY
                </code>{" "}
                to a folder containing auth JSON files.
              </>
            }
          />
        ) : (
          <div className="flex flex-col gap-5">
            {seats?.map((seat, i) => (
              <SeatCard
                key={seat.id}
                seat={seat}
                refreshKey={refreshKey}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 flex items-center gap-3 border-t border-zinc-800/50 pt-6">
          <span className="inline-block h-1 w-1 rounded-full bg-copper/40" />
          <p className="text-[0.625rem] tracking-wide text-zinc-700">
            Codex Seat Meter &middot; Local instance &middot; Tokens
            server-side only
          </p>
        </footer>
      </div>
    </main>
  );
}
