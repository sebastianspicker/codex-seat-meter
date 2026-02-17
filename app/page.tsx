"use client";

import { useState, useEffect, useCallback } from "react";
import { SeatCard } from "@/components/SeatCard";
import type { SeatMeta } from "@/types/seat";

export default function Home() {
  const [seats, setSeats] = useState<SeatMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchSeats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seats");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSeats(data as SeatMeta[]);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load seats");
      setSeats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeats();
  }, [fetchSeats]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

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
              <button
                type="button"
                onClick={fetchSeats}
                disabled={loading}
                className="group relative overflow-hidden rounded-md border border-slate-750 bg-surface-2 px-4 py-2 text-xs font-medium tracking-wide text-zinc-400 transition-all hover:border-copper-muted hover:text-copper-light disabled:opacity-40"
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
        <div className="mb-6 sm:hidden">
          <button
            type="button"
            onClick={fetchSeats}
            disabled={loading}
            className="w-full rounded-md border border-slate-750 bg-surface-2 px-4 py-2.5 text-xs font-medium text-zinc-400 transition-all hover:border-copper-muted hover:text-copper-light disabled:opacity-40"
          >
            {loading ? "Querying\u2026" : "Refresh all seats"}
          </button>
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
          <div className="flex items-center gap-3 py-20">
            <span className="inline-block h-1.5 w-1.5 animate-pulse-slow rounded-full bg-copper" />
            <p className="data-mono text-sm text-zinc-600">
              Establishing connection&hellip;
            </p>
          </div>
        ) : seats && seats.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-750 bg-surface-1 px-8 py-16 text-center">
            <p className="data-mono text-sm text-zinc-500">
              No seats detected
            </p>
            <p className="mt-2 text-xs text-zinc-600">
              Set{" "}
              <code className="rounded bg-surface-3 px-1.5 py-0.5 font-mono text-copper-dark">
                SEATS_DIRECTORY
              </code>{" "}
              to a folder containing auth JSON files.
            </p>
          </div>
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
