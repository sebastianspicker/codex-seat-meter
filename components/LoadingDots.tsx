"use client";
import { Loader2 } from "lucide-react";

interface Props {
  message?: string;
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
};

export function LoadingDots({ message, size = "md", className = "" }: Props) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-zinc-500 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className={`animate-spin text-copper ${sizeClasses[size]}`}
      />
      {message && (
        <p className="data-mono text-sm tracking-wide">{message}</p>
      )}
    </div>
  );
}
