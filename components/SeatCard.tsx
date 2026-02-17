"use client";

import { useState, useEffect, useCallback } from "react";
import { BalanceCardView } from "./BalanceCard";
import { isSeatStatusOk } from "@/types/seat";
import type { SeatMeta, SeatStatusResponse, SeatStatusError } from "@/types/seat";

interface Props {
  seat: SeatMeta;
  refreshKey: number;
  index: number;
}

export function SeatCard({ seat, refreshKey, index }: Props) {
  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "loading" }
    | { state: "ok"; data: SeatStatusResponse }
    | { state: "error"; data: SeatStatusError }
  >({ state: "idle" });

  const fetchStatus = useCallback(async () => {
    setStatus({ state: "loading" });
    try {
      const res = await fetch(
        `/api/seats/${encodeURIComponent(seat.id)}/status`
      );
      const data: unknown = await res.json();
      if (isSeatStatusOk(data)) {
        setStatus({ state: "ok", data });
      } else {
        const record = data as Record<string, unknown> | null;
        setStatus({
          state: "error",
          data: {
            ok: false,
            error:
              typeof record?.error === "string"
                ? record.error
                : "Unknown error from API",
          },
        });
      }
    } catch (err) {
      setStatus({
        state: "error",
        data: {
          ok: false,
          error: err instanceof Error ? err.message : "Request failed",
        },
      });
    }
  }, [seat.id]);

  useEffect(() => {
    if (!seat.error) {
      fetchStatus();
    }
  }, [fetchStatus, refreshKey, seat.error]);

  const lastRefreshFormatted = seat.last_refresh
    ? new Date(seat.last_refresh).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "\u2014";

  const hasFileError = !!seat.error;
  const isLoading = status.state === "loading" || status.state === "idle";
  const baseDelay = index * 80;

  return (
    <section
      className="animate-fade-up copper-glow copper-glow-hover group rounded-xl border border-zinc-800/60 bg-surface-1 transition-[border-color,box-shadow]"
      style={{ animationDelay: `${baseDelay}ms` }}
    >
      {/* Seat header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <span
            className={`mt-0.5 inline-block h-2 w-2 rounded-full ${
              hasFileError
                ? "bg-warm-red"
                : isLoading
                  ? "animate-pulse-slow bg-zinc-600"
                  : status.state === "error"
                    ? "bg-warm-red"
                    : "bg-copper"
            }`}
          />
          <div>
            <h2 className="font-serif text-lg font-medium text-zinc-100">
              {seat.id}
            </h2>
            <p className="data-mono mt-0.5 text-[0.625rem] text-zinc-600">
              {seat.auth_mode ?? "\u2014"} &middot; {lastRefreshFormatted}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Plan badge */}
          {status.state === "ok" && status.data.planType && (
            <span className="label-caps rounded border border-copper/20 bg-copper-faint px-2 py-0.5 text-copper">
              {status.data.planType}
            </span>
          )}

          {/* Credits */}
          {status.state === "ok" && status.data.credits && (
            <span className="data-mono text-[0.625rem] text-zinc-600">
              {status.data.credits.unlimited
                ? "unlimited"
                : status.data.credits.balance != null
                  ? `$${status.data.credits.balance.toFixed(2)}`
                  : status.data.credits.hasCredits
                    ? "credits"
                    : "no credits"}
            </span>
          )}

          {!hasFileError && (
            <button
              type="button"
              onClick={fetchStatus}
              disabled={status.state === "loading"}
              className="rounded border border-zinc-800 bg-surface-2 px-3 py-1 text-[0.625rem] font-medium uppercase tracking-wider text-zinc-500 transition-[border-color,color] hover:border-copper/30 hover:text-copper-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-1 disabled:opacity-30"
            >
              {status.state === "loading" ? "\u2026" : "Refresh"}
            </button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-800/60" />

      {/* Body */}
      <div className="px-6 py-5">
        {hasFileError ? (
          <div className="rounded-md border border-warm-red/15 bg-warm-red/5 px-4 py-3">
            <p className="label-caps mb-1 text-warm-red">Parse Error</p>
            <p className="data-mono text-xs text-warm-red/70">{seat.error}</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 py-4">
            <span className="inline-block h-1 w-1 animate-pulse-slow rounded-full bg-copper/40" />
            <p className="data-mono text-xs text-zinc-600">
              Fetching usage data&hellip;
            </p>
          </div>
        ) : status.state === "error" ? (
          <div className="rounded-md border border-warm-red/15 bg-warm-red/5 px-4 py-3">
            <p className="label-caps mb-1 text-warm-red">API Error</p>
            <p className="data-mono text-xs text-warm-red/70">
              {status.data.error}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <BalanceCardView
              card={status.data.balance.fiveHourUsageLimit}
              delay={baseDelay + 100}
            />
            <BalanceCardView
              card={status.data.balance.weeklyUsageLimit}
              delay={baseDelay + 180}
            />
            {status.data.balance.codeReview && (
              <BalanceCardView
                card={status.data.balance.codeReview}
                delay={baseDelay + 260}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
