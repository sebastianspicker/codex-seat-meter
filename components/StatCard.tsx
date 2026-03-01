"use client";

import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  subValue?: ReactNode;
  /** When set, shows a bottom progress bar with this width (0-100). */
  barPercent?: number | null;
  /** Optional: "error" (red), "muted" (zinc), or default (white/copper). */
  valueVariant?: "default" | "error" | "muted";
  className?: string;
}

const cardBase =
  "glass-card rounded-xl border border-zinc-800/40 p-5 shadow-lg backdrop-blur-md";

export function StatCard({
  icon,
  label,
  value,
  subValue,
  barPercent,
  valueVariant = "default",
  className = "",
}: Props) {
  const valueColor =
    valueVariant === "error"
      ? "data-mono text-2xl font-semibold text-warm-red"
      : valueVariant === "muted"
        ? "data-mono text-2xl font-semibold text-zinc-500"
        : "data-mono text-2xl font-semibold text-white";
  const iconColor =
    valueVariant === "error" ? "text-warm-red" : valueVariant === "muted" ? "text-zinc-500" : "text-copper-light";

  return (
    <div
      className={`relative overflow-hidden ${cardBase} ${className}`}
      style={barPercent != null ? { minHeight: "1px" } : undefined}
    >
      <div className="relative z-10 flex items-center gap-3 mb-2">
        <span className={`h-4 w-4 shrink-0 [&>svg]:h-4 [&>svg]:w-4 ${iconColor}`}>{icon}</span>
        <h3 className="label-caps">{label}</h3>
      </div>
      <p className={`relative z-10 ${valueColor} ${subValue ? "tracking-tight" : ""}`}>
        {value}
        {subValue != null && <span className="text-sm font-normal text-zinc-600"> {subValue}</span>}
      </p>
      {barPercent != null && Number.isFinite(barPercent) && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-warm-amber to-copper-light"
          style={{ width: `${Math.max(0, Math.min(100, barPercent))}%` }}
        />
      )}
    </div>
  );
}
