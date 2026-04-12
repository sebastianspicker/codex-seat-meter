"use client";

import { Users, ServerCrash, CreditCard, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import type { DashboardStats } from "@/lib/dashboard-stats";

interface Props {
  stats: DashboardStats;
  seatCount: number;
}

export function StatsSection({ stats, seatCount }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-10 animate-fade-up lg:grid-cols-4">
      <StatCard
        icon={<Users />}
        label="Active Seats"
        value={stats.activeSeats}
        subValue={`/ ${seatCount}`}
      />
      <StatCard
        icon={<ServerCrash />}
        label="Errors"
        value={stats.totalErrors}
        valueVariant={stats.totalErrors > 0 ? "error" : "muted"}
      />
      <StatCard
        icon={<CreditCard />}
        label="Total Balance"
        value={`$${Number.isFinite(stats.totalCredits) ? stats.totalCredits.toFixed(2) : "0.00"}`}
      />
      <StatCard
        icon={<Activity />}
        label="Lowest Limit"
        value={stats.minRateLimit !== null ? `${stats.minRateLimit}%` : "\u2014"}
        barPercent={stats.minRateLimit}
      />
    </div>
  );
}
