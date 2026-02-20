"use client";
import { CopyX } from "lucide-react";

interface Props {
  title: string;
  description: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-750 bg-surface-1/50 px-8 py-16 text-center backdrop-blur-sm ${className}`}
      role="status"
    >
      <div className="mb-4 rounded-full bg-surface-2 p-3 shadow-inner">
        <CopyX className="h-6 w-6 text-zinc-600" />
      </div>
      <p className="data-mono text-sm font-medium tracking-wide text-zinc-400">{title}</p>
      <div className="mt-2 max-w-sm text-xs text-zinc-500">{description}</div>
    </div>
  );
}
