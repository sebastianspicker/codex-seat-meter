"use client";

import type { BalanceCard as BalanceCardType } from "@/types/seat";
import { formatDateTime } from "@/lib/format";

interface Props {
  card: BalanceCardType;
  delay?: number;
}

function getBarGradient(percent: number): string {
  if (percent <= 5) return "from-warm-red to-warm-red/80 shadow-[0_0_10px_rgba(180,85,85,0.4)]";
  if (percent <= 25) return "from-warm-amber to-warm-amber/80 shadow-[0_0_10px_rgba(184,148,74,0.4)]";
  return "from-copper to-copper-light shadow-[0_0_12px_rgba(200,149,108,0.5)]";
}

function getTextColor(percent: number): string {
  if (percent <= 10) return "text-warm-red group-hover:text-warm-red/90";
  if (percent <= 25) return "text-warm-amber group-hover:text-warm-amber/90";
  return "text-copper-light group-hover:text-copper";
}

export function BalanceCardView({ card, delay = 0 }: Props) {
  const percent = Math.round(card.remainingPercent);
  const bgGradient = getBarGradient(percent);
  const numColor = getTextColor(percent);

  return (
    <article
      className="animate-fade-up group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-zinc-800/40 bg-surface-2/50 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-700/60 hover:bg-surface-2/80 hover:shadow-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-4 relative z-10">
        <p className="label-caps">{card.label}</p>
        {card.resetAt && (
          <p className="data-mono whitespace-nowrap text-[0.625rem] tracking-wide text-zinc-500 transition-colors group-hover:text-zinc-400">
            resets {formatDateTime(card.resetAt)}
          </p>
        )}
      </div>

      <div className="flex items-baseline gap-1.5 relative z-10">
        <span className={`data-mono text-2xl font-semibold transition-colors duration-300 ${numColor}`}>
          {percent}
        </span>
        <span className="data-mono text-sm tracking-wide text-zinc-600 transition-colors group-hover:text-zinc-500">% remaining</span>
      </div>

      {/* Progress track */}
      <div className="relative mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/80 shadow-inner z-10">
        <div
          className={`animate-bar-fill absolute left-0 top-0 h-full rounded-full bg-gradient-to-r ${bgGradient}`}
          style={{
            width: `${percent}%`,
            animationDelay: `${delay + 200}ms`,
          }}
        />
      </div>

      {/* Subtle background glow on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-zinc-800/0 via-zinc-800/0 to-zinc-800/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </article>
  );
}
