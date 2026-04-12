"use client";

import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  /** "compact" for inline/card use (smaller padding and icon). */
  variant?: "default" | "compact";
  className?: string;
}

const baseClasses =
  "flex items-start gap-3 border border-warm-red/20 bg-warm-red/5 text-warm-red shadow-inner";

export function AlertBanner({ icon, title, children, variant = "default", className = "" }: Props) {
  const sizeClasses =
    variant === "compact"
      ? "rounded-md px-4 py-3 [&_svg]:h-4 [&_svg]:w-4"
      : "rounded-lg px-5 py-4 [&_svg]:h-5 [&_svg]:w-5";
  return (
    <div
      className={`${baseClasses} ${sizeClasses} ${className}`.trim()}
      role="alert"
    >
      <span className="mt-0.5 shrink-0 text-warm-red/80">{icon}</span>
      <div>
        <p className="label-caps mb-1 text-warm-red">{title}</p>
        <div className="text-sm tracking-wide text-warm-red/80 [&_.data-mono]:text-xs">{children}</div>
      </div>
    </div>
  );
}
