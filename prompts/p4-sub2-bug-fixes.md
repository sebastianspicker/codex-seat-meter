# Phase 4, Sub-Phase 2: Known Bug Verification & Fixes

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

The repo has an extensive inspection history documented in `INSPECTION-FINDINGS.md`. All 12 findings (P2-1 through P3-12) were reportedly fixed, but need re-verification. Additionally, Phase 2 refactoring and Phase 3 test additions may have introduced new issues.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- All source files (`lib/*.ts`, `app/**/*.ts`, `app/**/*.tsx`, `components/*.tsx`, `types/*.ts`)

### Files you MUST NOT modify:
- Test files (unless fixing a test that's wrong due to a bug in the test itself)
- Documentation files
- Config files, package files

## Objective

Verify all prior inspection findings remain fixed, check for regressions from Phase 2/3, and fix any bugs found.

## Tasks

### 1. Re-verify Inspection Findings

Read `INSPECTION-FINDINGS.md` and verify each fix in the current code:

| Finding | Description | Verify In |
|---------|-------------|-----------|
| P2-1 | Stale status contamination in dashboard stats | `lib/dashboard-stats.ts` |
| P2-2 | Batch endpoint weak controls (max 50, concurrency 5) | `app/api/seats/statuses/route.ts` |
| P2-3 | Secret query parameter leakage | `app/page.tsx` (history.replaceState) |
| P2-4 | URL misconfiguration throw | Error handling in URL construction |
| P2-5 | Secret sent in API query string | `lib/api-auth.ts` (header-based) |
| P2-6 | CSP only in metadata | `next.config.ts` (HTTP header) |
| P2-7 | Auth load failures mapped as 404 | `lib/seat-status-service.ts` (status mapping) |
| P2-8 | Query-param secret in production | `lib/config.ts` (gate function) |
| P3-5 | Missing baseline security headers | `next.config.ts` |
| P3-6 | Demo mode accepted unknown seats | `lib/demo-data.ts` (membership check) |
| P3-7 | localStorage could throw | `lib/storage.ts` (safe wrappers) |
| P3-9 | Seat ID validation weak | `lib/seats.ts` (isSafeSeatId) |
| P3-10 | Relative SEATS_DIRECTORY allowed | `lib/config.ts` (absolute path check) |

### 2. Check for Regressions from Phase 2

Phase 2 refactored `app/page.tsx` into extracted hooks and improved error handling. Verify:
- Dashboard still loads seats correctly
- Status fetching still works (batch endpoint call)
- Auto-refresh still functions
- Filter/sort/search still work
- Preferences still persist in localStorage

### 3. Check for Race Conditions

- `refreshInFlightRef` guard: Does it actually prevent concurrent refresh calls?
- Auto-refresh + manual refresh: Can they race and cause duplicate fetches?
- Visibility change handler: Does it properly stop/restart refresh on tab hide/show?
- Batch status fetching: Is the concurrency limit (5) enforced correctly?

### 4. Fix Any Bugs Found

For each bug:
1. Document the bug clearly in the commit message
2. Write the minimal fix
3. Verify the fix with `npm run check`
4. If the fix requires a test change and the test is genuinely wrong, fix the test too

## Completion Criteria

- All 12+ inspection findings verified as still fixed
- No regressions from Phase 2/3 refactoring
- No race conditions found (or fixed if found)
- All fixes pass `npm run check`

## Max Iterations: 4

If you reach iteration 4 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p4-sub2.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`
2. Iteration 1: Re-verify inspection findings (read code, check each fix)
3. Iteration 2: Check for regressions from Phase 2/3
4. Iteration 3: Check race conditions
5. Fix any bugs found along the way
6. Run `npm run check` after any fixes
7. If all criteria met: `<promise>DONE</promise>`
8. If not done: end normally (stop hook re-invokes you)
