import { NextResponse } from "next/server";

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

export function jsonNoStore<T>(body: T, init?: ResponseInit): NextResponse<T> {
  const headers = new Headers(init?.headers);
  Object.entries(NO_STORE_HEADERS).forEach(([key, value]) => headers.set(key, value));
  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

export function jsonError(
  error: string,
  status = 500
): NextResponse<{ ok: false; error: string }> {
  return jsonNoStore({ ok: false, error }, { status });
}
