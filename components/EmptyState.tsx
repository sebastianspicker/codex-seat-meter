"use client";

interface Props {
  title: string;
  description: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, className = "" }: Props) {
  return (
    <div
      className={`rounded-lg border border-dashed border-slate-750 bg-surface-1 px-8 py-16 text-center ${className}`}
      role="status"
    >
      <p className="data-mono text-sm text-zinc-500">{title}</p>
      <div className="mt-2 text-xs text-zinc-600">{description}</div>
    </div>
  );
}
