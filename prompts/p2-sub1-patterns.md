# Phase 2, Sub-Phase 1: Code Patterns & Anti-Patterns

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- `app/page.tsx` (520 lines — primary refactoring target)
- `components/*.tsx` (all 8 components)
- `lib/*.ts` (all 17 lib modules)
- May CREATE new files in `lib/hooks/` or `lib/` for extracted hooks

### Files you MUST NOT modify:
- `test/` directory (tests will be updated in Phase 3)
- `package.json`, `package-lock.json`
- `.github/`, config files at root level
- `app/api/` routes (error handling in those is Phase 2 Sub 3's scope)

## Objective

Improve code structure and patterns. The primary target is `app/page.tsx` (520 lines) which contains multiple inline hooks and complex logic that should be extracted.

## Tasks

1. **Refactor `app/page.tsx`**:
   This file currently contains:
   - Dashboard state management (seats, statuses, preferences)
   - Auto-refresh logic with interval management
   - Batch status fetching with concurrency control
   - Search, filter, sort state
   - Clock/time display
   - Multiple useCallback/useEffect hooks

   Extract into focused custom hooks:
   - `useDashboardData()` — seat loading, status fetching, batch logic
   - `useAutoRefresh()` — interval management, visibility change handling
   - `useDashboardPreferences()` — filter, sort, search, localStorage persistence
   - Keep `app/page.tsx` as a thin composition layer

2. **Review React patterns in components**:
   - Check `key` prop usage in lists
   - Review `useCallback`/`useMemo` usage — remove unnecessary memoization
   - Check effect dependency arrays for correctness
   - Verify Suspense boundaries are used appropriately

3. **Review lib module patterns**:
   - Check for consistent function signature styles
   - Verify single-responsibility per module
   - Look for functions that should be combined or split
   - Ensure consistent export patterns (named vs. default)

4. **Naming consistency**:
   - Verify consistent naming conventions across files
   - Check for misleading or unclear function/variable names

## Important Constraints

- Do NOT change the public API of any module (function signatures, export names) without also updating all call sites
- Maintain all existing functionality — this is purely structural
- Extracted hooks must be importable and usable from `app/page.tsx`
- All extracted code must pass TypeScript strict mode

## Completion Criteria

- `app/page.tsx` reduced to < 200 lines (composition layer)
- Extracted hooks are in separate files with clear single responsibilities
- No anti-patterns found on re-scan
- `npm run check` passes (full quality gate)

## Max Iterations: 5

If you reach iteration 5 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p2-sub1.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`, `git diff HEAD~1`
2. If first iteration: read `app/page.tsx` fully and plan extraction
3. Extract one hook per iteration (incremental, testable progress)
4. Run `npm run check` after each extraction
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
