# Phase 2, Sub-Phase 2: Dead Code Removal

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- All source files (`lib/*.ts`, `app/**/*.ts`, `app/**/*.tsx`, `components/*.tsx`, `types/*.ts`)
- `app/globals.css` (unused CSS)

### Files you MUST NOT modify:
- `test/` directory
- `package.json`, `package-lock.json` (even if you find unused deps — document them instead)
- Config files (`eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, etc.)
- `.github/` directory
- Documentation files (`*.md`)

## Objective

Find and remove dead code — unused exports, functions, variables, types, unreachable code paths, and unused CSS.

## Tasks

1. **Unused exports**:
   For each module in `lib/`, check if every export is imported somewhere:
   ```bash
   # For each export, search for imports
   grep -r "import.*functionName" --include="*.ts" --include="*.tsx"
   ```
   Remove exports that are never imported (but verify they're not used dynamically).

2. **Unused functions/variables**:
   - Check for private (non-exported) functions/variables that are never called
   - Check for parameters that are never used (but respect interface contracts)
   - TypeScript's `noUnusedLocals` and `noUnusedParameters` can help detect these

3. **Unreachable code**:
   - Look for code after `return`, `throw`, `break`, `continue` statements
   - Look for conditions that are always true/false
   - Look for branches that can never execute based on types

4. **Unused CSS** (`app/globals.css`):
   - Check custom CSS classes/properties that aren't referenced in any component
   - Tailwind utilities are fine — focus on custom CSS only

5. **Unused dependencies** (document only):
   - If you find dependencies in `package.json` that are never imported, document them in a file `UNUSED-DEPS.md` — do NOT modify `package.json`

6. **Unused type definitions** (`types/seat.ts`):
   - Check if all exported interfaces/types are actually used
   - Remove any that are completely unused

## Important Constraints

- ONLY remove code. Do NOT refactor, rename, or restructure.
- If unsure whether code is used (e.g., it might be used dynamically or via framework conventions), leave it and add a comment: `// Potentially unused — verify before removing`
- Never remove Next.js framework files (layout.tsx, page.tsx, error.tsx, not-found.tsx) even if they seem "unused"
- Never remove type exports that are part of a discriminated union (even if one variant seems unused)

## Completion Criteria

- All source files scanned for dead code
- No dead code found on re-scan
- `npm run check` passes (full quality gate)

## Max Iterations: 3

If you reach iteration 3 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p2-sub2.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`, `git diff HEAD~1`
2. Scan for dead code (one category per iteration)
3. Remove confirmed dead code, commit with clear messages
4. Run `npm run check` after removals
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
