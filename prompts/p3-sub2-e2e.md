# Phase 3, Sub-Phase 2: E2E Test Creation

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

Playwright is already a dev dependency (`playwright@^1.58.2`) but is currently only used for screenshot capture (`scripts/capture-readme-screenshots.mjs`). No E2E test infrastructure exists yet.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY create/modify:
- NEW: `playwright.config.ts` (Playwright configuration)
- NEW: `test/e2e/*.spec.ts` (E2E test files)
- `package.json` — ONLY to add `"test:e2e"` script (no other changes)

### Files you MUST NOT modify:
- Source files (`lib/`, `app/`, `components/`)
- Existing test files in `test/lib/`, `test/api/`
- `test/setup.ts` (Vitest setup, not Playwright)
- Config files other than creating `playwright.config.ts`

## Objective

Create a Playwright E2E test suite that tests the dashboard in demo mode (DEMO_MODE=1), verifying the full user experience works end-to-end.

## Tasks

1. **Create Playwright config** (`playwright.config.ts`):
   ```typescript
   // Key settings:
   // - webServer: start Next.js dev server with DEMO_MODE=1
   // - baseURL: http://localhost:3000
   // - testDir: test/e2e
   // - browsers: chromium only (for speed in CI)
   // - retries: 1 (for flake tolerance)
   ```

2. **Add npm script** to `package.json`:
   ```json
   "test:e2e": "npx playwright test"
   ```
   Do NOT add this to the `check` command (E2E tests are too slow for the quality gate).

3. **Install Playwright browsers**:
   ```bash
   npx playwright install chromium
   ```

4. **Write E2E tests** in `test/e2e/`:

   **`test/e2e/dashboard.spec.ts`** — Core dashboard:
   - Dashboard loads and displays 3 demo seats (personal, team-alpha, team-beta)
   - Each seat card shows seat ID, auth mode, status
   - Balance bars are visible with percentage values
   - Stats section shows aggregate data (active seats, total credits)

   **`test/e2e/search-filter.spec.ts`** — Search & filtering:
   - Search filters seats by name (type "personal" → only 1 result)
   - Filter dropdown: "Healthy" shows seats without errors
   - Sort dropdown: "Lowest Limit" reorders seats
   - Clear search shows all seats again

   **`test/e2e/refresh.spec.ts`** — Refresh behavior:
   - Manual refresh button triggers status reload
   - Auto-refresh toggle starts/stops interval
   - Refresh interval selector changes timing

   **`test/e2e/error-pages.spec.ts`** — Error states:
   - 404 page renders for `/nonexistent`
   - Dashboard handles gracefully when demo data is shown

5. **Verify tests run in demo mode**:
   - The webServer config should set `DEMO_MODE=1`
   - No real API calls should be made during E2E tests
   - Tests should be deterministic (demo data is static)

## Important Constraints

- E2E tests MUST use demo mode — no real auth files or API calls
- Tests should be fast (< 30 seconds total for the suite)
- Use Playwright's recommended patterns: locators, auto-waiting, web-first assertions
- Use `page.getByRole()`, `page.getByText()`, etc. over CSS selectors
- Each test should be independent (no shared state between tests)

## Completion Criteria

- `playwright.config.ts` exists and is properly configured
- At least 4 E2E test files with 10+ test cases total
- `npm run test:e2e` passes with all tests green
- Tests complete in < 30 seconds
- `npm run check` still passes (E2E not added to check)

## Max Iterations: 5

If you reach iteration 5 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p3-sub2.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`
2. Iteration 1: Set up Playwright config + npm script + first test file
3. Subsequent iterations: Add more test files, fix flaky tests
4. Run `npm run test:e2e` to verify
5. Run `npm run check` to ensure no regressions
6. If all criteria met: `<promise>DONE</promise>`
7. If not done: end normally (stop hook re-invokes you)
