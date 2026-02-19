"use client";

import { useState, useEffect, useCallback } from "react";
import { BalanceCardView } from "./BalanceCard";
import { LoadingDots } from "./LoadingDots";
import { isSeatStatusOk } from "@/types/seat";
import type { SeatMeta, SeatStatusResponse, SeatStatusError } from "@/types/seat";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

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
          error: getErrorMessage(err, "Request failed"),
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
    ? formatDateTime(seat.last_refresh)
    : "\u2014";

  const hasFileError = !!seat.error;
  const isLoading = status.state === "loading" || status.state === "idle";
  const baseDelay = index * 80;

  return (
    <section
      className="animate-fade-up copper-glow copper-glow-hover group rounded-xl border border-zinc-800/60 bg-surface-1 transition-[border-color,box-shadow]"
      style={{ animationDelay: `${baseDelay}ms` }}
      aria-busy={isLoading}
      aria-live="polite"
      aria-label={`Seat ${seat.id} usage status`}
    >
      {/* Seat header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <span
            aria-hidden
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
              className="btn-secondary px-3 py-1 text-[0.625rem] text-zinc-500 hover:text-copper-dark focus-visible:ring-offset-surface-1 disabled:opacity-30"
              aria-label={`Refresh usage for ${seat.id}`}
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
          <LoadingDots
            message="Fetching usage data&hellip;"
            size="sm"
            className="py-4"
          />
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
