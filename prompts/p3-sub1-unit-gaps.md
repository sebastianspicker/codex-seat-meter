# Phase 3, Sub-Phase 1: Unit Test Gap Filling

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

The project uses Vitest with jsdom, @testing-library/react, @testing-library/jest-dom, and MSW for HTTP mocking. Test setup is in `test/setup.ts`.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY create/modify:
- NEW files in `test/lib/` — tests for untested modules
- NEW files in `test/api/` — tests for untested API routes
- NEW files in `test/components/` — tests for untested components

### Files you MUST NOT modify:
- Source files (`lib/`, `app/`, `components/`) — no production code changes
- EXISTING test files (edge cases will be added by sub-phase 3)
- `test/setup.ts` (unless a new test genuinely needs setup changes)
- Config files, package files

## Objective

Fill the test coverage gaps. Currently 11 test files exist, but 7 lib modules, 2 API routes, and all 8 components are untested.

## Current Test Coverage

### Already tested (DO NOT duplicate):
- `test/lib/api-auth.test.ts` → `lib/api-auth.ts`
- `test/lib/api-urls.test.ts` → `lib/api-urls.ts`
- `test/lib/auth.test.ts` → `lib/auth.ts`
- `test/lib/config.test.ts` → `lib/config.ts`
- `test/lib/dashboard-controls.test.ts` → `lib/dashboard-controls.ts`
- `test/lib/dashboard-stats.test.ts` → `lib/dashboard-stats.ts`
- `test/lib/seat-status-service.test.ts` → `lib/seat-status-service.ts`
- `test/lib/seats.test.ts` → `lib/seats.ts`
- `test/lib/storage.test.ts` → `lib/storage.ts`
- `test/lib/usage-mapper.test.ts` → `lib/usage-mapper.ts`
- `test/api/statuses-route.test.ts` → `app/api/seats/statuses/route.ts`

### Untested lib modules (CREATE tests for these):
1. `lib/errors.ts` — error message extraction
2. `lib/format.ts` — date/time formatting
3. `lib/demo-data.ts` — mock seat data
4. `lib/api-response.ts` — response helpers (jsonNoStore, jsonError)
5. `lib/usage-client.ts` — HTTP fetch with retries (use MSW to mock)
6. `lib/seat-guards.ts` — type guards (partially tested indirectly)
7. `lib/fonts.ts` — font definitions (may be trivial to test)

### Untested API routes (CREATE tests for these):
8. `app/api/seats/route.ts` — GET /api/seats
9. `app/api/seats/[id]/status/route.ts` — GET /api/seats/:id/status

### Untested components (CREATE tests for these):
10. `components/AlertBanner.tsx`
11. `components/BalanceCard.tsx`
12. `components/DashboardToolbar.tsx`
13. `components/EmptyState.tsx`
14. `components/LoadingDots.tsx`
15. `components/SeatCard.tsx`
16. `components/StatCard.tsx`
17. `components/StatsSection.tsx`

## Tasks

1. **Read existing test files** to understand patterns:
   - How tests are structured (describe/it blocks)
   - How MSW is used for HTTP mocking
   - How modules are imported (path aliases `@/lib/...`)
   - How assertions are written

2. **Write tests for untested lib modules** (items 1-7):
   - Follow existing test patterns
   - Cover the happy path + one error case per function
   - For `usage-client.ts`: use MSW to mock HTTP responses, test retry behavior
   - For `seat-guards.ts`: test each type guard with valid and invalid inputs
   - For `fonts.ts`: if only re-exports/config, a smoke test is sufficient

3. **Write tests for untested API routes** (items 8-9):
   - Follow the pattern in `test/api/statuses-route.test.ts`
   - Test: success response, auth failure, missing params, error conditions

4. **Write tests for components** (items 10-17):
   - Use @testing-library/react for rendering
   - Test: renders without crashing, displays expected content, handles props
   - For interactive components (DashboardToolbar): test user interactions
   - Mock any data dependencies

5. **Run coverage**:
   ```bash
   npx vitest run --coverage
   ```
   Document the coverage improvement.

## Completion Criteria

- Every lib module has a corresponding test file
- Both untested API routes have test files
- At least 4 of 8 components have test files (most impactful ones: SeatCard, DashboardToolbar, BalanceCard, AlertBanner)
- `lib/` and `app/api/` coverage > 80%
- All new tests pass
- `npm run check` passes (full quality gate)

## Max Iterations: 6

If you reach iteration 6 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p3-sub1.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`
2. Write tests for 2-3 modules per iteration
3. Run `npx vitest run` to verify they pass
4. Commit: `git commit -m "test: add tests for <module>"`
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
