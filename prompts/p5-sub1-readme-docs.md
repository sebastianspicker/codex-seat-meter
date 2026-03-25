# Phase 5, Sub-Phase 1: README & Documentation Updates

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

Phases 1-4 have been completed. Dependencies are updated, code is refactored, tests are expanded, and bugs are fixed. The documentation needs to reflect these changes.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- `README.md`
- `SECURITY.md`
- `demo/README.md`
- `INSPECTION-FINDINGS.md` (add final status section)
- May CREATE new files in `docs/` directory

### Files you MUST NOT modify:
- Source files (`.ts`, `.tsx`)
- Test files
- Config files, package files
- `.github/` directory

## Objective

Ensure all documentation accurately reflects the current state of the codebase after Phases 1-4.

## Tasks

1. **Update README.md**:
   - Verify all npm scripts listed are current (add `test:e2e` if Phase 3 added it)
   - Update dependency versions mentioned in the README
   - Verify API route documentation matches actual implementation
   - Update environment variable documentation if any changed
   - Add an architecture overview section if none exists:
     - Project structure (directories and their purposes)
     - Data flow: seat files → API routes → dashboard UI
     - Key modules and their roles
   - Verify all screenshot paths still work (`npm run check:readme-assets`)

2. **Update SECURITY.md**:
   - Verify supported versions are current
   - Update any security-related information that changed in Phase 1/4
   - Confirm vulnerability reporting process is accurate

3. **Update demo/README.md**:
   - Verify demo mode instructions are accurate
   - Update if any demo data or behavior changed

4. **Update INSPECTION-FINDINGS.md**:
   - Add a "Final Status" section at the bottom
   - Note which findings were re-verified in Phase 4
   - Document any new findings discovered and fixed during the pipeline
   - Mark the document as a historical record

5. **Create architecture documentation** (if valuable):
   - Only if the README architecture section is insufficient
   - Keep it concise — a single `docs/architecture.md` at most
   - Focus on data flow and module responsibilities

## Important Constraints

- Documentation should be factual and accurate — verify claims against the actual code
- Don't add speculative features or future plans
- Keep documentation concise — prefer bullet points over paragraphs
- Don't duplicate information already in code comments (that's sub-phase 2's job)
- Respect the project's existing documentation tone and style

## Completion Criteria

- README accurately reflects current scripts, deps, API routes, and env vars
- `npm run check:readme-assets` passes (screenshot paths valid)
- SECURITY.md is current
- INSPECTION-FINDINGS.md has a final status section
- `npm run check` passes (full quality gate)

## Max Iterations: 3

If you reach iteration 3 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p5-sub1.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`
2. Read current documentation, compare against actual code
3. Update one document per iteration
4. Run `npm run check` (includes readme-assets check)
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
