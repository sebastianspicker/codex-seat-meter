"use client";

interface Props {
  message?: string;
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses = {
  sm: "h-1 w-1",
  md: "h-1.5 w-1.5",
};

export function LoadingDots({ message, size = "md", className = "" }: Props) {
  return (
    <div
      className={`flex items-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className={`inline-block animate-pulse-slow rounded-full bg-copper ${sizeClasses[size]}`}
      />
      {message && (
        <p className="data-mono text-sm text-zinc-600">{message}</p>
      )}
    </div>
  );
}
