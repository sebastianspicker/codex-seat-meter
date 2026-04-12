# Phase 1, Sub-Phase 1: Dependency Audit & Updates

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- `package.json`
- `package-lock.json`

### Files you MUST NOT modify:
- Everything else. No source files, no config files, no test files.

## Objective

Audit and update all dependencies to eliminate known vulnerabilities and keep packages current.

## Tasks

1. **Audit vulnerabilities**:
   ```bash
   npm audit
   npm audit --omit=dev --audit-level=moderate
   ```
   Fix all vulnerabilities that have available patches.

2. **Known issue**: `next@16.1.6` has multiple moderate-severity CVEs (HTTP request smuggling, unbounded cache growth, CSRF bypass). Update to latest safe version (16.2.1+).

3. **Check for outdated packages**:
   ```bash
   npm outdated
   ```
   Update patch and minor versions where safe. For major version bumps, evaluate breaking changes before updating.

4. **Verify no breaking changes**: After each update, run `npm run check` to ensure nothing breaks.

5. **Lock file integrity**: Ensure `package-lock.json` is regenerated cleanly after updates:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run check
   ```

## Completion Criteria

- `npm audit --omit=dev --audit-level=moderate` reports **0 vulnerabilities**
- `npm audit --audit-level=high` reports **0 high/critical vulnerabilities** (including dev deps)
- `npm outdated` shows no patch-level updates available for production deps
- `npm run check` passes (full quality gate)

## Max Iterations: 4

If you reach iteration 4 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p1-sub1.md` documenting what couldn't be updated and why

## Iteration Protocol

1. Check previous work: `git log --oneline -5`, `git diff HEAD~1`
2. Determine what remains (run audit, check outdated)
3. Make incremental progress (update one group of deps at a time)
4. Run `npm run check` after each update — fix any regressions
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
