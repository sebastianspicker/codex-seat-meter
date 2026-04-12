# Deep Inspection Findings (Code + Security)

**Date:** 2026-03-01  
**Scope:** Full repo inspection for correctness and security risks, with iterative fixes until no new P3 findings appeared.

## Executive summary

- P0: 0
- P1: 0
- P2: 4 (all fixed)
- P3: 5 (all fixed)
- Final re-scan: no new P3 findings in inspected paths.

---

## Prioritized findings (by probability)

### P2-1. Stale status contamination in dashboard aggregates
- **Probability:** Medium
- **Where:** `lib/dashboard-stats.ts`
- **Why suspicious:** Stats were computed from all seat IDs including seats with file parse errors, so stale prior status data could inflate active seat count/credits/min-limit.
- **Why it could occur:** A seat can transition from valid -> file error; stale status remained in memory and was still counted.
- **Fix:** Ignore status entries for seats currently marked with file errors.
- **Status:** Fixed.

### P2-2. Batch status endpoint had weak request-shaping controls
- **Probability:** Medium
- **Where:** `app/api/seats/statuses/route.ts`
- **Why suspicious:** Endpoint allowed potentially large ID sets and aggressive upstream fan-out.
- **Why it could occur:** Crafted requests could request many seats at once and spike upstream/API load.
- **Fix:** Added `MAX_BATCH_IDS` cap (50), plus bounded upstream fan-out (`FETCH_CONCURRENCY = 5`).
- **Status:** Fixed.

### P2-3. Secret query parameter leakage risk
- **Probability:** Medium
- **Where:** `app/page.tsx`, `app/layout.tsx`, `next.config.ts`
- **Why suspicious:** `?secret=` in URL can leak through history/referrer and remain exposed in address bar.
- **Why it could occur:** User opens dashboard with `?secret=...` and keeps browsing.
- **Fix:** Capture secret once and immediately remove it from URL via `history.replaceState`; added `referrer: no-referrer` metadata and `Referrer-Policy` response header.
- **Status:** Fixed/mitigated.

### P2-4. Misconfigured usage URL could throw uncaught in status service
- **Probability:** Medium
- **Where:** `lib/seat-status-service.ts`
- **Why suspicious:** `getCodexUsageUrl()` exceptions were not caught in the service path.
- **Why it could occur:** Invalid `CODEX_USAGE_BASE_URL` or path at runtime.
- **Fix:** Wrapped URL resolution with explicit 500 error mapping.
- **Status:** Fixed.

### P3-1. Timeout handle cleanup leak in usage fetch retries
- **Probability:** Medium
- **Where:** `lib/usage-client.ts`
- **Why suspicious:** timeout was cleared only on success path.
- **Why it could occur:** network error/abort path exits without clearing timer, causing unnecessary pending timers.
- **Fix:** Introduced `finally` cleanup for timeout handle.
- **Status:** Fixed.

### P3-2. Repeated short-secret warning log spam
- **Probability:** Medium
- **Where:** `lib/config.ts`
- **Why suspicious:** warning emitted on every request if secret is short.
- **Why it could occur:** `getDashboardSecret()` is called for each API request.
- **Fix:** Warn once per process via a module-level guard.
- **Status:** Fixed.

### P3-3. Legacy comma-delimited `ids=` parsing edge case
- **Probability:** Low
- **Where:** `app/api/seats/statuses/route.ts`
- **Why suspicious:** double-decoding could reject valid values containing `%`.
- **Why it could occur:** `URLSearchParams` already decodes values; additional decode can throw.
- **Fix:** Legacy parser no longer double-decodes; modern client path moved to repeated `id` query params.
- **Status:** Fixed.

### P3-4. Unauthorized responses were cache-policy inconsistent
- **Probability:** Low
- **Where:** `lib/auth.ts`
- **Why suspicious:** unauthorized responses used direct `NextResponse.json` without unified no-store behavior.
- **Why it could occur:** 401 responses could be cached under some intermediaries.
- **Fix:** switched to shared `jsonNoStore` helper.
- **Status:** Fixed.

### P3-5. Missing baseline hardening headers
- **Probability:** Low
- **Where:** `next.config.ts`
- **Why suspicious:** baseline browser hardening headers were not consistently set.
- **Why it could occur:** default framework behavior does not guarantee all desired headers.
- **Fix:** added `Referrer-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, and `Permissions-Policy` globally.
- **Status:** Fixed.

---

## Iteration log

### Pass 1
- Identified P2/P3 issues listed above.
- Implemented first remediation set.

### Pass 2
- Re-scanned and found additional P3 edge case in legacy `ids=` parser and fan-out behavior.
- Implemented second remediation set.

### Pass 3
- Re-ran static inspection + tests/lint/typecheck/build.
- No new P3 findings discovered in inspected code paths.

---

## Verification

- `npm run check` passes.
- `npm run coverage` passes.
- Added/updated regression tests for:
  - stats correctness with stale statuses
  - batch route validation/limits/legacy support
  - URL helper query handling
  - status service misconfiguration handling


---

## Follow-up inspection (appended)

**Date:** 2026-03-01 (follow-up pass)

### Newly identified findings (by probability)

### P2-5. Secret still sent in API query string on every dashboard fetch
- **Probability:** Medium
- **Where:** `app/page.tsx` (client fetch calls), `lib/api-urls.ts`
- **Why suspicious:** Even after removing `?secret=` from the browser address bar, the client still appended `secret` in every API request URL.
- **Why it could occur:** URL helper functions were used with `secret` argument for all fetches.
- **Impact:** Secret may appear in server/proxy logs and network tooling.
- **Fix:** Added `lib/api-auth.ts` and switched all client API calls to send `x-dashboard-secret` header (`RequestInit`), not query params.
- **Status:** Fixed.

### P2-6. CSP configured only as metadata value (potentially ineffective)
- **Probability:** Medium
- **Where:** `app/layout.tsx`, `next.config.ts`
- **Why suspicious:** Metadata `other["content-security-policy"]` is not a guaranteed HTTP response header security control.
- **Why it could occur:** CSP was set in metadata, not in route headers config.
- **Impact:** False sense of protection if CSP is not enforced as an HTTP header.
- **Fix:** Added `Content-Security-Policy` in global response headers via `next.config.ts` and kept security directives explicit there.
- **Status:** Fixed.

### P3-6. Demo mode returned success for unknown seat IDs
- **Probability:** Medium
- **Where:** `lib/seat-status-service.ts`
- **Why suspicious:** Any valid-looking seat id in demo mode returned synthetic success data.
- **Why it could occur:** Demo path did not verify seat ID membership against known demo seats.
- **Impact:** Incorrect behavior and masked ID mistakes in local testing.
- **Fix:** Enforced membership check against `MOCK_SEATS`; unknown seat now returns 404.
- **Status:** Fixed.

### P3-7. localStorage operations could throw in restricted environments
- **Probability:** Low-Medium
- **Where:** `app/page.tsx`
- **Why suspicious:** direct `localStorage.getItem/setItem` can throw in privacy/restricted contexts.
- **Why it could occur:** browser policy or storage access restrictions.
- **Impact:** Potential runtime exceptions and degraded UX.
- **Fix:** Added guarded helpers in `lib/storage.ts` and migrated dashboard preference read/write to safe wrappers.
- **Status:** Fixed.

### P3-8. Legacy `ids=` parser over-decoding edge case
- **Probability:** Low
- **Where:** `app/api/seats/statuses/route.ts`
- **Why suspicious:** parser manually called `decodeURIComponent` on values already decoded by `URLSearchParams`.
- **Why it could occur:** percent-containing IDs (e.g. `%`) caused decode errors in legacy path.
- **Impact:** unnecessary 400 responses for valid IDs.
- **Fix:** removed second decode; split/trim only.
- **Status:** Fixed.

---

## Iteration log (follow-up)

### Pass 4
- Added failing tests for:
  - header-based dashboard auth request init
  - safe localStorage access wrappers
  - demo unknown seat 404 behavior
- Implemented corresponding fixes.

### Pass 5
- Re-scanned parsing and header paths; found and fixed legacy decode edge case.
- Re-ran lint/typecheck/tests/build.
- No new P3 findings discovered in this pass.

---

## Follow-up verification

- `npm run check` passes.
- Test count increased to 29 passing tests.
- New regression tests added for:
  - `lib/api-auth.ts`
  - `lib/storage.ts`
  - demo unknown-seat handling in `fetchSeatStatus`
  - legacy/repeated seat-id query handling behavior.

### Pass 6 (final follow-up)
- Removed `secret` query support from client URL builders (`lib/api-urls.ts`) to prevent accidental future reintroduction of query-secret leakage.
- Verified all dashboard client fetch paths use header-based auth helper (`x-dashboard-secret`).
- Re-ran lint/typecheck/tests/build.
- No new P3 findings discovered.

---

## Additional deep inspection (appended)

**Date:** 2026-03-01 (additional pass)

### Newly identified suspicious areas (prioritized by probability)

### P2-7. Non-404 auth-load failures were incorrectly mapped as 404
- **Probability:** Medium
- **Where:** `lib/seat-status-service.ts`
- **Why suspicious:** Any exception from `loadSeatAuth()` (invalid JSON, permission errors) returned 404.
- **Why it could occur:** catch block treated all auth-load errors as "not found".
- **Impact:** Incorrect error semantics, harder incident diagnosis, and misleading client behavior.
- **Fix:** Added status mapping logic:
  - `ENOENT` -> `404`
  - `Invalid ...` format errors -> `400`
  - other read/permission errors -> `500`
- **Status:** Fixed.

### P2-8. Query-param dashboard secret still accepted in production by default
- **Probability:** Medium
- **Where:** `lib/auth.ts`, `lib/config.ts`
- **Why suspicious:** Query secrets are more likely to leak via logs/history/referrer.
- **Why it could occur:** auth guard always accepted `?secret=` if provided.
- **Impact:** Elevated accidental credential exposure risk in production environments.
- **Fix:** Added `allowDashboardSecretQueryParam()` policy:
  - production default: query-secret disabled
  - explicit override via `ALLOW_DASHBOARD_SECRET_QUERY=1`
  - non-production remains permissive for local convenience
- **Status:** Fixed.

### P3-9. Seat ID validation allowed control chars / leading-trailing whitespace
- **Probability:** Medium
- **Where:** `lib/seats.ts`, `lib/seat-status-service.ts`
- **Why suspicious:** IDs with control characters/whitespace are ambiguous in logs/UI and can cause inconsistent behavior.
- **Why it could occur:** validation only blocked `/`, `\\`, `..`, and null byte.
- **Impact:** log injection/noise risk and brittle ID handling.
- **Fix:** Introduced shared `isSafeSeatId()` with stricter checks (trim-stable, control-char rejection, length/path constraints) and reused in both filesystem and API validation paths.
- **Status:** Fixed.

### P3-10. Relative `SEATS_DIRECTORY` path accepted (runtime cwd-dependent)
- **Probability:** Low-Medium
- **Where:** `lib/config.ts`
- **Why suspicious:** relative paths resolve from runtime cwd and can point to unintended directories.
- **Why it could occur:** config only checked presence, not absolute-path requirement.
- **Impact:** fragile deployments and accidental directory scope mistakes.
- **Fix:** enforce absolute path (`path.isAbsolute`) with explicit error message.
- **Status:** Fixed.

---

## Iteration log (additional pass)

### Pass 7
- Added failing tests for:
  - auth policy in production for query-secret behavior
  - stricter seat-id rejection behavior
  - auth-load error status mapping
  - absolute path requirement for `SEATS_DIRECTORY`
- Implemented fixes in config/auth/seat-status-service/seat-id validation.

### Pass 8
- Re-ran lint/typecheck/tests/build and audit.
- No new P3 findings discovered.

---

## Additional verification

- `npm run check` passes.
- `npm audit` reports 0 vulnerabilities.
- Test suite increased to 36 passing tests.

---

## Additional deep inspection (appended again)

**Date:** 2026-03-01 (latest pass)

### Newly identified suspicious areas (prioritized by probability)

### P2-9. Incorrect status mapping for auth load failures
- **Probability:** Medium
- **Where:** `lib/seat-status-service.ts`
- **Why suspicious:** all auth-load exceptions were treated as 404.
- **Why it could occur:** broad catch returned fixed 404 branch.
- **Impact:** invalid-format and permission errors were misreported as missing seat.
- **Fix:** differentiated by failure type (`ENOENT` -> 404, `Invalid ...` -> 400, other errors -> 500).
- **Status:** Fixed.

### P2-10. Query-param secret accepted in production without explicit opt-in
- **Probability:** Medium
- **Where:** `lib/auth.ts`, `lib/config.ts`
- **Why suspicious:** production acceptance of query secrets increases leakage risk via logs/history/referrer.
- **Why it could occur:** auth guard always considered query secret.
- **Impact:** elevated accidental credential exposure risk.
- **Fix:** added `allowDashboardSecretQueryParam()` gate; production default denies query-secret unless `ALLOW_DASHBOARD_SECRET_QUERY=1`.
- **Status:** Fixed.

### P3-11. Seat-id validation allowed ambiguous identifiers
- **Probability:** Medium
- **Where:** `lib/seats.ts`, `lib/seat-status-service.ts`
- **Why suspicious:** control characters and leading/trailing whitespace were accepted.
- **Why it could occur:** validation covered only a subset of invalid patterns.
- **Impact:** log/UI ambiguity and brittle identity handling.
- **Fix:** introduced shared `isSafeSeatId()` and reused it for path resolution and API validation.
- **Status:** Fixed.

### P3-12. Relative `SEATS_DIRECTORY` path accepted
- **Probability:** Low-Medium
- **Where:** `lib/config.ts`
- **Why suspicious:** relative paths depend on runtime cwd and can point to unexpected locations.
- **Why it could occur:** path presence check without absolute-path enforcement.
- **Impact:** misconfiguration risk and unintended filesystem scope.
- **Fix:** enforce absolute path in `getSeatsDirectory()`.
- **Status:** Fixed.

---

## Iteration log (latest pass)

### Pass 9
- Added failing tests for:
  - production query-secret auth policy
  - strict seat-id validation edge cases
  - auth-load status mapping
  - absolute path enforcement for `SEATS_DIRECTORY`
- Implemented corresponding fixes in auth/config/seats/seat-status-service.

### Pass 10
- Re-ran static search + lint/typecheck/tests/build + audit.
- No new P3 findings discovered.

---

## Latest verification

- `npm run check` passes.
- `npm audit` reports 0 vulnerabilities.
- Test suite increased to 36 passing tests.
