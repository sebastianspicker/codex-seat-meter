import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="data-mono text-6xl font-semibold text-copper/30">404</p>
        <h1 className="mt-4 font-serif text-2xl font-medium text-zinc-100">
          Not found
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          The page you are looking for does not exist.
        </p>
        <Link href="/" className="btn-secondary mt-6 inline-block">
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
