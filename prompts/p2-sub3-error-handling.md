# Phase 2, Sub-Phase 3: Error Handling Improvements

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- `lib/errors.ts`
- `lib/usage-client.ts`
- `lib/seat-status-service.ts`
- `lib/seats.ts`
- `app/api/seats/route.ts`
- `app/api/seats/[id]/status/route.ts`
- `app/api/seats/statuses/route.ts`
- `app/error.tsx`

### Files you MUST NOT modify:
- `components/*.tsx` (not in scope)
- `app/page.tsx` (handled by sub-phase 1)
- `lib/auth.ts`, `lib/config.ts` (handled by Phase 1)
- `test/` directory
- Config files, package files

## Objective

Improve error handling patterns across API routes and server-side logic. Ensure errors are properly typed, messages are safe for clients, and retry logic is sound.

## Known Issues

These were identified during repo analysis:

1. **`lib/usage-client.ts:74`** — Logs up to 500 chars of API response text in `console.error`. This could expose sensitive data from the upstream API.

2. **`lib/seats.ts:83`** — Logs seat ID and file path on read failures. The seat ID is not sensitive, but the full file path reveals server directory structure.

3. **`lib/seat-status-service.ts:38,55,80`** — Error messages returned to API clients may include internal details like "Server misconfigured: SEATS_DIRECTORY invalid". These should be sanitized before reaching the client.

4. **`app/error.tsx:18`** — Displays `error.message` directly. In production, this could show internal error messages to users.

## Tasks

1. **Sanitize console.error calls**:
   - `lib/usage-client.ts`: Log only status code and attempt number, not response body
   - `lib/seats.ts`: Log only that a read failed for a seat, not the full path
   - Ensure no tokens, secrets, or full paths appear in server logs

2. **Sanitize client-facing error messages**:
   - `lib/seat-status-service.ts`: Replace internal detail messages with generic user-safe messages
   - Keep detailed errors in server-side logs only
   - Pattern: `console.error(detailedError); return { error: "Failed to load seat status" };`

3. **Review catch blocks**:
   - Ensure all catch blocks properly type errors (`unknown`, not `any`)
   - Ensure catch blocks don't swallow errors silently
   - Check for missing catch blocks on async operations

4. **Review `app/error.tsx`**:
   - In production, show a generic error message, not `error.message`
   - `error.digest` is safe to show (it's a hash) but `error.message` may contain internals
   - Consider: `process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.'`

5. **Review retry logic** (`lib/usage-client.ts`):
   - Verify retry conditions (429, 502, 503) are correct
   - Verify timeout (8s) is appropriate
   - Verify backoff between retries
   - Ensure retry doesn't mask permanent failures

6. **API route error responses**:
   - Verify all API routes return consistent error format: `{ error: string }`
   - Verify HTTP status codes are appropriate (400, 401, 404, 500)
   - Verify all error responses use `jsonNoStore` (no caching of errors)

## Completion Criteria

- All console.error calls sanitized (no sensitive data logged)
- All client-facing error messages are generic and safe
- All catch blocks properly typed
- `app/error.tsx` safe for production
- Retry logic reviewed and documented
- `npm run check` passes (full quality gate)

## Max Iterations: 4

If you reach iteration 4 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p2-sub3.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`, `git diff HEAD~1`
2. Focus on one task area per iteration
3. Make changes, run `npm run check`
4. If all criteria met: `<promise>DONE</promise>`
5. If not done: end normally (stop hook re-invokes you)
