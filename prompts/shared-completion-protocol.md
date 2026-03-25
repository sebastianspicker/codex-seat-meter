# Completion Protocol

Every Ralph Loop sub-phase MUST signal completion using one of these promise tags. The orchestrator uses these to determine when to proceed.

## Signals

### DONE — Full Completion
```
<promise>DONE</promise>
```
Use when ALL completion criteria are met AND `npm run check` passes.

### DONE_PARTIAL — Timed Out
```
<promise>DONE_PARTIAL</promise>
```
Use when you've reached the maximum iteration count without completing all criteria.
You MUST also create a file `REMAINING-WORK-pN-subM.md` documenting:
- What was completed
- What remains
- Why it wasn't finished (complexity, blocking issue, etc.)

### BLOCKED — Cannot Proceed
```
<promise>BLOCKED</promise>
```
Use when you cannot proceed without human input or an external dependency.
You MUST also create a file `BLOCKED-pN-subM.md` documenting:
- What blocked you
- What decision or input is needed
- Suggested resolution options

## Rules

1. Signal EXACTLY ONCE per sub-phase execution — at the very end of your final iteration
2. ALWAYS run `npm run check` before signaling DONE — if it fails, fix it first
3. NEVER signal DONE if the quality gate is failing
4. If you're unsure whether criteria are met, do NOT signal — let the next iteration verify
5. Commit all work before signaling — the orchestrator will merge your branch after the signal
