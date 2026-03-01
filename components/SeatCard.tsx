"use client";

import { BalanceCardView } from "./BalanceCard";
import { LoadingDots } from "./LoadingDots";
import { AlertBanner } from "@/components/AlertBanner";
import { formatDateTime } from "@/lib/format";
import type { SeatMeta, StatusState } from "@/types/seat";
import { RefreshCw, ServerCrash, AlertTriangle } from "lucide-react";

interface Props {
  seat: SeatMeta;
  status: StatusState;
  index: number;
  onRefresh: () => void;
}

export function SeatCard({ seat, status, index, onRefresh }: Props) {
  const hasFileError = Boolean(seat.error);
  const isLoading = status.state === "loading" || status.state === "idle";
  const baseDelay = index * 80;

  return (
    <section
      className="animate-fade-up glass-card copper-glow copper-glow-hover group rounded-xl border border-zinc-800/60 bg-surface-1/80 transition-all duration-300 backdrop-blur-md"
      style={{ animationDelay: `${baseDelay}ms` }}
      aria-busy={isLoading}
      aria-live="polite"
      aria-label={`Seat ${seat.id} usage status`}
    >
      <SeatCardHeader
        seat={seat}
        status={status}
        hasFileError={hasFileError}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />
      <div className="h-px w-full bg-gradient-to-r from-zinc-800/0 via-zinc-800/60 to-zinc-800/0" />
      <SeatCardBody
        seat={seat}
        status={status}
        hasFileError={hasFileError}
        isLoading={isLoading}
        baseDelay={baseDelay}
      />
    </section>
  );
}

function SeatCardHeader({
  seat,
  status,
  hasFileError,
  isLoading,
  onRefresh,
}: {
  seat: SeatMeta;
  status: StatusState;
  hasFileError: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  const lastRefreshFormatted = seat.last_refresh ? formatDateTime(seat.last_refresh) : "\u2014";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className={`mt-0.5 inline-block h-2 w-2 rounded-full ring-2 ring-offset-2 ring-offset-surface-1/80 transition-colors ${
            hasFileError
              ? "bg-warm-red ring-warm-red/20"
              : isLoading
                ? "animate-pulse-slow bg-zinc-500 ring-zinc-500/20"
                : status.state === "error"
                  ? "bg-warm-red ring-warm-red/20"
                  : "bg-copper ring-copper/20"
          }`}
        />
        <div>
          <h2 className="font-serif text-lg font-medium text-zinc-100 placeholder-glow">{seat.id}</h2>
          <p className="data-mono mt-0.5 text-[0.625rem] tracking-wide text-zinc-500">
            {seat.auth_mode ?? "\u2014"} &middot; {lastRefreshFormatted}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {status.state === "ok" && status.data.planType && (
          <span className="label-caps rounded-full border border-copper/20 bg-copper-faint px-2.5 py-0.5 text-copper shadow-sm">
            {status.data.planType}
          </span>
        )}

        {status.state === "ok" && status.data.credits && (
          <span className="data-mono text-[0.625rem] tracking-wider text-zinc-500">
            {status.data.credits.unlimited
              ? "unlimited"
              : typeof status.data.credits.balance === "number" &&
                  Number.isFinite(status.data.credits.balance)
                ? `$${status.data.credits.balance.toFixed(2)}`
                : status.data.credits.hasCredits
                  ? "credits"
                  : "no credits"}
          </span>
        )}

        {!hasFileError && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 btn-secondary px-3 py-1 text-[0.625rem] text-zinc-400 hover:text-copper-light focus-visible:ring-offset-surface-1 disabled:opacity-30"
            aria-label={`Refresh usage for ${seat.id}`}
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Refreshing" : "Refresh"}
          </button>
        )}
      </div>
    </div>
  );
}

function SeatCardBody({
  seat,
  status,
  hasFileError,
  isLoading,
  baseDelay,
}: {
  seat: SeatMeta;
  status: StatusState;
  hasFileError: boolean;
  isLoading: boolean;
  baseDelay: number;
}) {
  return (
    <div className="px-6 py-5">
      {hasFileError ? (
        <AlertBanner icon={<AlertTriangle />} title="Parse Error" variant="compact">
          <p className="data-mono text-xs">{seat.error}</p>
        </AlertBanner>
      ) : isLoading ? (
        <LoadingDots message="Fetching usage data&hellip;" size="sm" className="py-4 opacity-70" />
      ) : status.state === "error" ? (
        <AlertBanner icon={<ServerCrash />} title="API Error" variant="compact">
          <p className="data-mono text-xs">{status.data.error}</p>
        </AlertBanner>
      ) : status.state === "ok" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <BalanceCardView card={status.data.balance.fiveHourUsageLimit} delay={baseDelay + 100} />
          <BalanceCardView card={status.data.balance.weeklyUsageLimit} delay={baseDelay + 180} />
          {status.data.balance.codeReview && (
            <BalanceCardView card={status.data.balance.codeReview} delay={baseDelay + 260} />
          )}
        </div>
      ) : null}
    </div>
  );
}
