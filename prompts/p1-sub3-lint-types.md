# Phase 1, Sub-Phase 3: Lint & Type Checking Fixes

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- All `.ts` and `.tsx` files (for fixing lint/type issues)
- `eslint.config.mjs` (ESLint configuration)
- `tsconfig.json` (TypeScript configuration)

### Files you MUST NOT modify:
- `package.json`, `package-lock.json` (handled by sub-phase 1)
- `next.config.ts` (handled by sub-phase 2)
- `.github/` directory (handled by sub-phase 2)

## Objective

Ensure zero lint warnings, zero type errors, and evaluate stricter static analysis rules.

## Tasks

1. **Fix existing lint issues**:
   ```bash
   npx eslint . --max-warnings=0
   ```
   Fix all warnings and errors. Do NOT suppress with `eslint-disable` unless the rule is genuinely wrong for the specific case.

2. **Fix type errors**:
   ```bash
   npx tsc --noEmit
   ```
   Resolve all TypeScript errors. Prefer proper typing over `any` casts.

3. **Evaluate stricter ESLint rules** (`eslint.config.mjs`):
   Consider enabling (if not already):
   - `no-unused-vars` with `argsIgnorePattern: "^_"`
   - `@typescript-eslint/consistent-type-imports`
   - `@typescript-eslint/no-explicit-any` (warn level)
   - `@typescript-eslint/no-floating-promises`

   Only enable rules that the codebase already passes or that require minimal fixes. Do NOT enable rules that would require major refactoring.

4. **Review TypeScript strictness** (`tsconfig.json`):
   Verify these are enabled (they should be in strict mode):
   - `strict: true`
   - `noUncheckedIndexedAccess` — consider enabling if not already
   - `exactOptionalPropertyTypes` — evaluate feasibility

   Only enable options that the codebase can support with minimal changes.

5. **Consistent import style**:
   - Ensure `type` imports use `import type { ... }` consistently
   - Verify no circular dependencies between modules

## Completion Criteria

- `npx eslint . --max-warnings=0` reports zero issues
- `npx tsc --noEmit` reports zero errors
- Any new ESLint rules enabled are documented (comment in eslint.config.mjs)
- `npm run check` passes (full quality gate)

## Max Iterations: 3

If you reach iteration 3 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p1-sub3.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`, `git diff HEAD~1`
2. Run `npx eslint .` and `npx tsc --noEmit` to see current state
3. Fix issues incrementally (don't try to fix everything at once)
4. Run `npm run check` after fixes
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
