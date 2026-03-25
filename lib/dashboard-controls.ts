import type { DashboardFilter, DashboardSort, SeatMeta, StatusState } from "@/types/seat";

const LOW_LIMIT_THRESHOLD = 25;

function getMinRemaining(status: StatusState | undefined): number | null {
  if (!status || status.state !== "ok") return null;
  return Math.min(
    status.data.balance.fiveHourUsageLimit.remainingPercent,
    status.data.balance.weeklyUsageLimit.remainingPercent
  );
}

function getCredits(status: StatusState | undefined): number | null {
  if (!status || status.state !== "ok") return null;
  const credits = status.data.credits?.balance;
  return typeof credits === "number" && Number.isFinite(credits) ? credits : null;
}

function isApiError(status: StatusState | undefined): boolean {
  return status?.state === "error";
}

function matchesFilter(
  seat: SeatMeta,
  status: StatusState | undefined,
  filter: DashboardFilter
): boolean {
  if (filter === "all") return true;
  if (filter === "file-error") return Boolean(seat.error);
  if (filter === "api-error") return isApiError(status);
  if (filter === "healthy") return !seat.error && status?.state === "ok";
  if (filter === "low-limit") {
    const minRemaining = getMinRemaining(status);
    return minRemaining != null && minRemaining <= LOW_LIMIT_THRESHOLD;
  }
  return true;
}

function sortSeats(
  seats: SeatMeta[],
  statuses: Record<string, StatusState>,
  sort: DashboardSort
): SeatMeta[] {
  const sorted = [...seats];

  if (sort === "lowest-limit") {
    sorted.sort((a, b) => {
      const aMin = getMinRemaining(statuses[a.id]);
      const bMin = getMinRemaining(statuses[b.id]);
      const aVal = aMin == null ? 101 : aMin;
      const bVal = bMin == null ? 101 : bMin;
      return aVal - bVal || a.id.localeCompare(b.id);
    });
    return sorted;
  }

  if (sort === "highest-credits") {
    sorted.sort((a, b) => {
      const aCredits = getCredits(statuses[a.id]);
      const bCredits = getCredits(statuses[b.id]);
      const aVal = aCredits == null ? -1 : aCredits;
      const bVal = bCredits == null ? -1 : bCredits;
      return bVal - aVal || a.id.localeCompare(b.id);
    });
    return sorted;
  }

  if (sort === "error-first") {
    sorted.sort((a, b) => {
      const aError = Number(Boolean(a.error || isApiError(statuses[a.id])));
      const bError = Number(Boolean(b.error || isApiError(statuses[b.id])));
      return bError - aError || a.id.localeCompare(b.id);
    });
    return sorted;
  }

  sorted.sort((a, b) => a.id.localeCompare(b.id));
  return sorted;
}

interface FilterSortInput {
  seats: SeatMeta[];
  statuses: Record<string, StatusState>;
  filter: DashboardFilter;
  sort: DashboardSort;
  query: string;
}

export function filterAndSortSeats({
  seats,
  statuses,
  filter,
  sort,
  query,
}: FilterSortInput): SeatMeta[] {
  const queryText = query.trim().toLowerCase();
  const filtered = seats.filter((seat) => {
    if (queryText && !seat.id.toLowerCase().includes(queryText)) return false;
    return matchesFilter(seat, statuses[seat.id], filter);
  });

  return sortSeats(filtered, statuses, sort);
}
