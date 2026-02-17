"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="label-caps mb-3 text-warm-red">Runtime Error</p>
        <h1 className="font-serif text-2xl font-medium text-zinc-100">
          Something went wrong
        </h1>
        <p className="data-mono mt-3 text-sm text-zinc-500">
          {error.message || "An unexpected error occurred."}
        </p>
        {error.digest && (
          <p className="data-mono mt-1 text-xs text-zinc-700">
            Digest: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md border border-zinc-800 bg-surface-2 px-5 py-2 text-xs font-medium uppercase tracking-wider text-zinc-400 transition-[border-color,color] hover:border-copper/30 hover:text-copper-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-copper/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
