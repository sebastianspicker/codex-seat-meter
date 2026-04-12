# Phase 4, Sub-Phase 3: Information Disclosure & Logging Fixes

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

This sub-phase addresses information disclosure issues identified during Phase 1's security audit and the initial repo analysis.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- `lib/usage-client.ts`
- `lib/seats.ts`
- `lib/seat-status-service.ts`
- `lib/errors.ts`
- `app/api/seats/route.ts`
- `app/api/seats/[id]/status/route.ts`
- `app/api/seats/statuses/route.ts`
- `app/error.tsx`

### Files you MUST NOT modify:
- `lib/auth.ts`, `lib/config.ts` (Phase 1's scope)
- Components (except `app/error.tsx`)
- Test files
- Config files, package files

## Objective

Ensure no internal details (file paths, config values, API responses, stack traces) leak to clients or server logs unnecessarily.

## Known Issues

### Issue 1: API Response Logging (`lib/usage-client.ts:74`)
```typescript
console.error(`[fetchUsage] API error ${status} on try ${attempt}: ${text.slice(0, 500)}`);
```
**Problem**: Logs up to 500 chars of upstream API response. This response could contain tokens, error details, or sensitive internal information from OpenAI's backend.
**Fix**: Log only the HTTP status code and attempt number. Remove response body from logs.

### Issue 2: Seat Path Logging (`lib/seats.ts:83`)
```typescript
console.error(`Failed to read seat ${id} from ${filePath}:`, err);
```
**Problem**: Logs the full filesystem path, revealing server directory structure.
**Fix**: Log the seat ID and a generic "read failed" message. Do not log the full path.

### Issue 3: Client Error Messages (`lib/seat-status-service.ts`)
Lines 38, 55, 80 return error messages that may include internal details:
- `"Server misconfigured: SEATS_DIRECTORY invalid"` — reveals config variable names
- `"Failed to load auth"` — acceptable but could be more generic
**Fix**: Return generic messages to API clients. Keep detailed messages in server logs only.

### Issue 4: Error Page Display (`app/error.tsx:18`)
```typescript
{error.message || "An unexpected error occurred."}
```
**Problem**: In production, `error.message` could contain internal error details.
**Fix**: In production, always show the generic message. Only show `error.message` in development.

## Tasks

1. **Audit all `console.error` and `console.warn` calls**:
   ```bash
   grep -rn "console\.\(error\|warn\|log\)" --include="*.ts" --include="*.tsx" lib/ app/
   ```
   For each call, verify it doesn't log:
   - Tokens or secrets
   - Full file paths
   - API response bodies that could contain sensitive data
   - Stack traces with internal paths

2. **Fix Issue 1** — Sanitize usage-client logging:
   - Log: `[fetchUsage] API error ${status} on attempt ${attempt}`
   - Do NOT log: response body, headers, URL with tokens

3. **Fix Issue 2** — Sanitize seat read logging:
   - Log: `Failed to read seat "${id}"`
   - Include error type (ENOENT, EACCES, etc.) but not the full path

4. **Fix Issue 3** — Sanitize client-facing error messages:
   - Server-side: `console.error("Detailed: ...", err)`
   - Client response: `{ error: "Failed to load seat status" }`
   - Never send config variable names, file paths, or internal state to clients

5. **Fix Issue 4** — Production-safe error page:
   ```typescript
   const message = process.env.NODE_ENV === 'development'
     ? error.message
     : 'An unexpected error occurred.';
   ```

6. **Review API route error responses**:
   For each route in `app/api/seats/`:
   - Verify 401 responses don't reveal which auth method was expected
   - Verify 404 responses don't reveal directory structure
   - Verify 500 responses don't include stack traces
   - Verify all error responses are consistent format: `{ error: "user-safe message" }`

## Completion Criteria

- All `console.error`/`console.warn` calls sanitized
- No client-facing responses contain internal details
- `app/error.tsx` is safe for production
- All API error responses are user-safe and consistent
- `npm run check` passes (full quality gate)

## Max Iterations: 3

If you reach iteration 3 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p4-sub3.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`
2. Iteration 1: Audit all console calls + fix Issues 1 & 2
3. Iteration 2: Fix Issues 3 & 4 + review API routes
4. Run `npm run check` after changes
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
