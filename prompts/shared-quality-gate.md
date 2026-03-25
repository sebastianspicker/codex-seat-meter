# Quality Gate

The quality gate is the mandatory check that must pass before any sub-phase can signal completion, and between every phase.

## Command

```bash
npm run check
```

This runs, in order:
1. `npm run check:readme-assets` — validates README screenshot paths exist
2. `npm run lint` — ESLint with `--max-warnings=0` (zero tolerance)
3. `npm run typecheck` — TypeScript `tsc --noEmit` (strict mode)
4. `npm run test` — Vitest unit/integration tests
5. `npm run build` — Next.js production build

ALL five checks must pass. A failure at any step means the gate has failed.

## When to Run

- **Before signaling completion**: Every sub-phase runs this before `<promise>DONE</promise>`
- **After merging sub-phases**: The phase orchestrator runs this after merging all sub-phase branches
- **Between phases**: The master orchestrator runs this after each phase completes

## On Failure

If the quality gate fails:
1. Read the error output carefully
2. Fix the issue in the current iteration
3. Run the gate again
4. Only signal completion once it passes

Do NOT:
- Signal DONE with a failing gate
- Skip individual checks
- Suppress warnings or errors to make the gate pass
- Modify the check script itself to remove failing steps
