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
        <button type="button" onClick={reset} className="btn-secondary mt-6">
          Try again
        </button>
      </div>
    </main>
  );
}
