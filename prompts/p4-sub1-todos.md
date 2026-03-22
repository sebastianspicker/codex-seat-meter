# Phase 4, Sub-Phase 1: TODO/FIXME Resolution

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- All source files (`lib/*.ts`, `app/**/*.ts`, `app/**/*.tsx`, `components/*.tsx`, `types/*.ts`)

### Files you MUST NOT modify:
- Test files (`test/` directory)
- Config files, package files
- Documentation files (that's Phase 5)
- `.github/` directory

## Objective

Find and resolve all TODO, FIXME, HACK, XXX, and WORKAROUND comments. If none exist, scan for "should-be-TODO" patterns — incomplete implementations or hardcoded values that should be configurable.

## Tasks

1. **Search for explicit markers**:
   ```bash
   grep -rn "TODO\|FIXME\|HACK\|XXX\|WORKAROUND" --include="*.ts" --include="*.tsx" lib/ app/ components/ types/
   ```

2. **If markers found**: Resolve each one:
   - Implement the TODO'd feature
   - Fix the FIXME'd issue
   - Replace the HACK with a proper solution
   - Resolve the WORKAROUND with the correct approach

3. **If no markers found** (expected — prior analysis showed zero): Scan for implicit TODOs:
   - **Hardcoded constants** that should be environment variables or config
   - **Placeholder implementations** that return dummy values
   - **Incomplete error handling** (empty catch blocks, generic error messages)
   - **Magic numbers** without explanation
   - **Commented-out code** that should be removed or implemented

4. **For each implicit TODO found**:
   - If it's a quick fix (< 10 lines): fix it directly
   - If it's a larger issue: leave it and document in `IMPLICIT-TODOS.md` for future work
   - Do NOT introduce large changes — this sub-phase should be lightweight

## Completion Criteria

- `grep -rn "TODO\|FIXME\|HACK\|XXX\|WORKAROUND"` returns zero results for source files
- Any implicit TODOs either fixed or documented in `IMPLICIT-TODOS.md`
- `npm run check` passes (full quality gate)

## Max Iterations: 3

If you reach iteration 3 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p4-sub1.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`
2. Search for TODOs/FIXMEs
3. If none: scan for implicit TODOs
4. Resolve or document findings
5. Run `npm run check`
6. If all criteria met: `<promise>DONE</promise>`
7. If not done: end normally (stop hook re-invokes you)
