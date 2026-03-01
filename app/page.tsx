"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SeatCard } from "@/components/SeatCard";
import { LoadingDots } from "@/components/LoadingDots";
import { EmptyState } from "@/components/EmptyState";
import { StatsSection } from "@/components/StatsSection";
import { AlertBanner } from "@/components/AlertBanner";
import { DashboardToolbar } from "@/components/DashboardToolbar";
import { isRecord, isSeatMetaArray, isSeatStatusOk, isSeatStatusesResponse } from "@/lib/seat-guards";
import { getErrorMessage } from "@/lib/errors";
import { formatTime } from "@/lib/format";
import { getSeatStatusUrl, getSeatStatusesUrl, getSeatsUrl } from "@/lib/api-urls";
import { getDashboardAuthRequestInit } from "@/lib/api-auth";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import { filterAndSortSeats } from "@/lib/dashboard-controls";
import { safeReadLocalStorage, safeWriteLocalStorage } from "@/lib/storage";
import type {
  DashboardFilter,
  DashboardPreferences,
  DashboardSort,
  SeatMeta,
  SeatStatusResult,
  StatusState,
} from "@/types/seat";
import { ServerCrash } from "lucide-react";

const DEFAULT_AUTO_REFRESH_MS = 60_000;
const MIN_AUTO_REFRESH_MS = 5_000;
const MAX_AUTO_REFRESH_MS = 300_000;
const STATUS_BATCH_CHUNK_SIZE = 25;
const PREFERENCES_STORAGE_KEY = "codex-seat-meter.preferences";
const FILTER_VALUES: DashboardFilter[] = ["all", "healthy", "file-error", "api-error", "low-limit"];
const SORT_VALUES: DashboardSort[] = ["id", "lowest-limit", "highest-credits", "error-first"];

function getAutoRefreshIntervalMs(): number {
  if (typeof process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL_MS !== "string") return DEFAULT_AUTO_REFRESH_MS;
  const value = parseInt(process.env.NEXT_PUBLIC_AUTO_REFRESH_INTERVAL_MS, 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_AUTO_REFRESH_MS;
}

function normalizeFilter(value: unknown): DashboardFilter {
  return FILTER_VALUES.includes(value as DashboardFilter) ? (value as DashboardFilter) : "all";
}

function normalizeSort(value: unknown): DashboardSort {
  return SORT_VALUES.includes(value as DashboardSort) ? (value as DashboardSort) : "id";
}

function normalizeIntervalMs(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  if (rounded < MIN_AUTO_REFRESH_MS || rounded > MAX_AUTO_REFRESH_MS) return fallback;
  return rounded;
}

function getDefaultPreferences(): DashboardPreferences {
  return {
    autoRefresh: false,
    intervalMs: getAutoRefreshIntervalMs(),
    sort: "id",
    filter: "all",
    query: "",
  };
}

function readStoredPreferences(): DashboardPreferences {
  if (typeof window === "undefined") return getDefaultPreferences();

  const defaults = getDefaultPreferences();
  const raw = safeReadLocalStorage(PREFERENCES_STORAGE_KEY);
  if (!raw) return defaults;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return defaults;

    return {
      autoRefresh: parsed.autoRefresh === true,
      intervalMs: normalizeIntervalMs(parsed.intervalMs, defaults.intervalMs),
      sort: normalizeSort(parsed.sort),
      filter: normalizeFilter(parsed.filter),
      query: typeof parsed.query === "string" ? parsed.query : defaults.query,
    };
  } catch {
    return defaults;
  }
}

function toStatusState(value: unknown): StatusState {
  if (isSeatStatusOk(value)) {
    return { state: "ok", data: value };
  }
  if (isRecord(value) && value.ok === false && typeof value.error === "string") {
    return { state: "error", data: { ok: false, error: value.error } };
  }
  return { state: "error", data: { ok: false, error: "Unexpected response shape" } };
}

function useClock(): string {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const update = () => setTimeStr(formatTime(new Date()));
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, []);

  return timeStr;
}

function useDashboardData(secret: string | null, preferences: DashboardPreferences) {
  const [seats, setSeats] = useState<SeatMeta[] | null>(null);
  const [statuses, setStatuses] = useState<Record<string, StatusState>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const refreshInFlightRef = useRef(false);

  const fetchStatusesBatch = useCallback(
    async (seatIds: string[]) => {
      const uniqueSeatIds = [...new Set(seatIds)];
      if (uniqueSeatIds.length === 0) {
        setStatuses({});
        return;
      }

      setStatuses((prev) => {
        const next = { ...prev };
        uniqueSeatIds.forEach((id) => {
          next[id] = { state: "loading" };
        });
        return next;
      });

      for (let start = 0; start < uniqueSeatIds.length; start += STATUS_BATCH_CHUNK_SIZE) {
        const chunk = uniqueSeatIds.slice(start, start + STATUS_BATCH_CHUNK_SIZE);
        const response = await fetch(
          getSeatStatusesUrl(chunk),
          getDashboardAuthRequestInit(secret)
        );
        const payload: unknown = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message =
            isRecord(payload) && typeof payload.error === "string"
              ? payload.error
              : `HTTP ${response.status}`;
          throw new Error(message);
        }

        if (!isSeatStatusesResponse(payload)) {
          throw new Error("Unexpected response format from /api/seats/statuses");
        }

        setStatuses((prev) => {
          const next = { ...prev };
          chunk.forEach((id) => {
            const result: SeatStatusResult | undefined = payload.statuses[id];
            next[id] = result
              ? toStatusState(result)
              : { state: "error", data: { ok: false, error: "Missing seat status" } };
          });
          return next;
        });
      }
    },
    [secret]
  );

  const refreshAll = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(getSeatsUrl(), getDashboardAuthRequestInit(secret));
      const payload: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : `HTTP ${response.status}`;
        throw new Error(message);
      }

      if (!isSeatMetaArray(payload)) {
        throw new Error("Unexpected response format from /api/seats");
      }

      setSeats(payload);
      const ids = payload.filter((seat) => !seat.error).map((seat) => seat.id);

      try {
        await fetchStatusesBatch(ids);
      } catch (statusError) {
        const message = getErrorMessage(statusError, "Failed to load statuses");
        setError(message);
        setStatuses((prev) => {
          const next = { ...prev };
          ids.forEach((id) => {
            next[id] = { state: "error", data: { ok: false, error: message } };
          });
          return next;
        });
      }

      setLastUpdatedAt(new Date());
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load seats"));
      setSeats(null);
      setStatuses({});
    } finally {
      setLoading(false);
      refreshInFlightRef.current = false;
    }
  }, [fetchStatusesBatch, secret]);

  const refreshSeat = useCallback(
    async (seatId: string) => {
      setStatuses((prev) => ({ ...prev, [seatId]: { state: "loading" } }));

      try {
        const response = await fetch(
          getSeatStatusUrl(seatId),
          getDashboardAuthRequestInit(secret)
        );
        const payload: unknown = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message =
            isRecord(payload) && typeof payload.error === "string"
              ? payload.error
              : `HTTP ${response.status}`;
          throw new Error(message);
        }

        setStatuses((prev) => ({
          ...prev,
          [seatId]: toStatusState(payload),
        }));
        setLastUpdatedAt(new Date());
      } catch (err) {
        setStatuses((prev) => ({
          ...prev,
          [seatId]: {
            state: "error",
            data: { ok: false, error: getErrorMessage(err, "Request failed") },
          },
        }));
      }
    },
    [secret]
  );

  const retryFailedSeats = useCallback(async () => {
    if (!seats?.length) return;
    const failedIds = seats
      .filter((seat) => !seat.error && statuses[seat.id]?.state === "error")
      .map((seat) => seat.id);

    if (failedIds.length === 0) return;

    try {
      await fetchStatusesBatch(failedIds);
      setLastUpdatedAt(new Date());
    } catch (err) {
      const message = getErrorMessage(err, "Failed to retry failed seats");
      setError(message);
      setStatuses((prev) => {
        const next = { ...prev };
        failedIds.forEach((id) => {
          next[id] = { state: "error", data: { ok: false, error: message } };
        });
        return next;
      });
    }
  }, [fetchStatusesBatch, seats, statuses]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!preferences.autoRefresh || !seats?.length) return;

    const tick = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      void refreshAll();
    };

    const intervalId = window.setInterval(tick, preferences.intervalMs);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshAll();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [preferences.autoRefresh, preferences.intervalMs, refreshAll, seats?.length]);

  return {
    seats,
    statuses,
    error,
    loading,
    lastUpdatedAt,
    refreshAll,
    refreshSeat,
    retryFailedSeats,
  };
}

function Dashboard() {
  const searchParams = useSearchParams();
  const [secret] = useState<string | null>(() => searchParams.get("secret"));

  const [preferences, setPreferences] = useState<DashboardPreferences>(() => readStoredPreferences());
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!secret) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("secret")) return;
    url.searchParams.delete("secret");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [secret]);

  useEffect(() => {
    safeWriteLocalStorage(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const {
    seats,
    statuses,
    error,
    loading,
    lastUpdatedAt,
    refreshAll,
    refreshSeat,
    retryFailedSeats,
  } = useDashboardData(secret, preferences);

  const timeStr = useClock();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if ((event.key === "r" || event.key === "R") && !isTyping) {
        event.preventDefault();
        void refreshAll();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [refreshAll]);

  const stats = useMemo(() => {
    if (!seats) return null;
    return computeDashboardStats(seats, statuses);
  }, [seats, statuses]);

  const visibleSeats = useMemo(() => {
    if (!seats) return [];
    return filterAndSortSeats({
      seats,
      statuses,
      filter: preferences.filter,
      sort: preferences.sort,
      query: preferences.query,
    });
  }, [seats, statuses, preferences]);

  const retryableFailures = useMemo(() => {
    if (!seats) return 0;
    return seats.filter((seat) => !seat.error && statuses[seat.id]?.state === "error").length;
  }, [seats, statuses]);

  return (
    <div className="mx-auto max-w-5xl relative z-10">
      <header className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div>
            <p className="label-caps mb-2 tracking-widest text-copper-dark drop-shadow-sm">Monitoring Dashboard</p>
            <h1 className="font-serif text-3xl font-medium tracking-tight text-white placeholder-glow md:text-4xl">
              Codex Seat Meter
            </h1>
          </div>
          <DashboardToolbar
            timeStr={timeStr}
            autoRefresh={preferences.autoRefresh}
            onAutoRefreshChange={(autoRefresh) =>
              setPreferences((prev) => ({ ...prev, autoRefresh }))
            }
            loading={loading}
            onRefresh={refreshAll}
            secret={secret}
            lastUpdatedAt={lastUpdatedAt}
            intervalMs={preferences.intervalMs}
            onIntervalMsChange={(intervalMs) =>
              setPreferences((prev) => ({
                ...prev,
                intervalMs: normalizeIntervalMs(intervalMs, prev.intervalMs),
              }))
            }
            query={preferences.query}
            onQueryChange={(query) => setPreferences((prev) => ({ ...prev, query }))}
            filter={preferences.filter}
            onFilterChange={(filter) => setPreferences((prev) => ({ ...prev, filter }))}
            sort={preferences.sort}
            onSortChange={(sort) => setPreferences((prev) => ({ ...prev, sort }))}
            failedCount={retryableFailures}
            onRetryFailed={retryFailedSeats}
            searchInputRef={searchInputRef}
          />
        </div>
        <div className="h-px bg-gradient-to-r from-copper/30 via-copper/5 to-transparent shadow-[0_1px_10px_rgba(200,149,108,0.2)]" />
      </header>

      {stats && seats && seats.length > 0 && <StatsSection stats={stats} seatCount={seats.length} />}

      {error && (
        <div className="animate-fade-up mb-8">
          <AlertBanner icon={<ServerCrash />} title="System Error">
            {error}
          </AlertBanner>
        </div>
      )}

      {loading && !seats ? (
        <DashboardLoadingSkeleton />
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
      ) : visibleSeats.length === 0 ? (
        <EmptyState
          title="No seats match current filters"
          description="Try clearing the search input or switching filter/sort options."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {visibleSeats.map((seat, index) => (
            <SeatCard
              key={seat.id}
              seat={seat}
              status={statuses[seat.id] ?? { state: "idle" }}
              index={index}
              onRefresh={() => void refreshSeat(seat.id)}
            />
          ))}
        </div>
      )}

      <footer className="mt-20 flex items-center justify-between border-t border-zinc-800/50 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-copper-dark shadow-[0_0_8px_rgba(166,121,82,0.8)]" />
          <p className="text-[0.6875rem] tracking-wider text-zinc-600 uppercase font-medium">Codex Seat Meter</p>
        </div>
        <p className="text-[0.625rem] tracking-wide text-zinc-700">Local Instance &middot; Tokens stay on server</p>
      </footer>
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-4 py-8">
      <LoadingDots message="Establishing connection&hellip;" className="pb-4" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-xl border border-zinc-800/60 bg-surface-1/70"
        />
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-12 lg:px-20 relative overflow-hidden">
      <Suspense fallback={<LoadingDots message="Loading dashboard..." className="py-24" />}>
        <Dashboard />
      </Suspense>
    </main>
  );
}
