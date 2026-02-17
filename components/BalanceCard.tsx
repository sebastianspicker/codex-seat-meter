"use client";

import type { BalanceCard as BalanceCardType } from "@/types/seat";

interface Props {
  card: BalanceCardType;
  delay?: number;
}

function getBarColor(percent: number): string {
  if (percent <= 10) return "bg-warm-red";
  if (percent <= 25) return "bg-warm-amber";
  return "bg-copper";
}

function getTextColor(percent: number): string {
  if (percent <= 10) return "text-warm-red";
  if (percent <= 25) return "text-warm-amber";
  return "text-copper-light";
}

export function BalanceCardView({ card, delay = 0 }: Props) {
  const percent = Math.round(card.remainingPercent);
  const barColor = getBarColor(percent);
  const numColor = getTextColor(percent);

  return (
    <article
      className="animate-fade-up flex flex-col gap-3 rounded-lg border border-zinc-800/60 bg-surface-1 p-5 transition-colors hover:border-zinc-700/60"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="label-caps">{card.label}</p>
        {card.resetAt && (
          <p className="data-mono whitespace-nowrap text-[0.625rem] text-zinc-600">
            resets {new Date(card.resetAt).toLocaleString([], {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className={`data-mono text-2xl font-semibold ${numColor}`}>
          {percent}
        </span>
        <span className="data-mono text-sm text-zinc-600">% remaining</span>
      </div>

      {/* Progress track */}
      <div className="relative h-1 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`animate-bar-fill absolute left-0 top-0 h-full rounded-full ${barColor}`}
          style={{
            width: `${percent}%`,
            animationDelay: `${delay + 200}ms`,
          }}
        />
      </div>
    </article>
  );
}
