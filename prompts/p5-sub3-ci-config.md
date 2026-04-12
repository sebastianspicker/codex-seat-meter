# Phase 5, Sub-Phase 3: CI & Configuration Improvements

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

The CI pipeline (`.github/workflows/ci.yml`) currently runs: checkout → setup node → npm ci → npm audit → npm run check. It's solid but could be enhanced.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- `.github/workflows/ci.yml`
- `.github/dependabot.yml`
- `package.json` (scripts section ONLY — not deps)
- `eslint.config.mjs`
- `vitest.config.ts`
- `next.config.ts` (non-security config only — security headers were Phase 1's scope)
- May CREATE: `.github/workflows/e2e.yml` (separate E2E workflow)

### Files you MUST NOT modify:
- Source files (`lib/`, `app/`, `components/`, `types/`)
- Test files
- Documentation files
- `package.json` dependencies (only scripts section)

## Objective

Improve CI/CD pipeline, developer experience tooling, and project configuration.

## Tasks

1. **Add coverage reporting to CI** (`.github/workflows/ci.yml`):
   - Add a step to run `npx vitest run --coverage` after the check step
   - Upload coverage report as an artifact
   - Consider adding a coverage threshold check

2. **Consider E2E CI workflow** (`.github/workflows/e2e.yml`):
   If Phase 3 created E2E tests with Playwright:
   - Create a separate workflow for E2E tests
   - Run on push to main and PRs
   - Use demo mode (DEMO_MODE=1)
   - Install Playwright browsers in CI
   - Keep separate from the main CI (E2E is slower)

3. **Review Dependabot config** (`.github/dependabot.yml`):
   - Verify grouping strategy makes sense
   - Consider adding reviewers or labels for auto-PRs
   - Verify the schedule is appropriate

4. **Add useful npm scripts** (`package.json`):
   If not already present, consider adding:
   - `"test:coverage"` — alias for coverage with threshold
   - `"clean"` — remove `.next/`, `coverage/`, `node_modules/`
   - Ensure all scripts documented in README

5. **Review ESLint config** (`eslint.config.mjs`):
   - If Phase 1 added stricter rules, verify they're properly documented
   - Consider adding `reportUnusedDisableDirectives: true`

6. **Review Vitest config** (`vitest.config.ts`):
   - Consider adding coverage thresholds
   - Verify test file patterns are correct
   - Check if `setupFiles` is properly configured

7. **Verify action versions** (`.github/workflows/ci.yml`):
   - All actions pinned to SHA (already done)
   - Check if newer SHA versions are available
   - Document which version each SHA corresponds to in comments

## Important Constraints

- CI changes should be backwards-compatible — don't break existing workflows
- Don't add heavy tooling that slows down CI significantly
- Keep changes minimal and focused — don't over-engineer the CI
- Any new workflow should have a 10-minute timeout like the existing one
- Don't add secrets or credentials to CI files

## Completion Criteria

- Coverage reporting added to CI
- E2E workflow created (if applicable)
- Dependabot config reviewed and updated if needed
- Useful npm scripts added
- `npm run check` passes (full quality gate)

## Max Iterations: 3

If you reach iteration 3 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p5-sub3.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`
2. Iteration 1: CI coverage + E2E workflow
3. Iteration 2: Dependabot + npm scripts + config review
4. Run `npm run check` after changes
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
