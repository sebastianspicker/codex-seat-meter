# Merge Protocol

Rules for phase orchestrators when merging parallel sub-phase branches.

## Merge Order

Sub-phases ALWAYS merge in deterministic order:
1. Sub-phase 1 merges first into the phase base branch
2. Sub-phase 2 merges second
3. Sub-phase 3 merges third

This order is fixed. It ensures reproducible results and simplifies conflict resolution.

## Merge Commands

```bash
# From the phase base branch (ralph/pN-base):
git merge --no-ff ralph/pN-sub1-<name> -m "Merge P[N] sub-phase 1: <name>"
git merge --no-ff ralph/pN-sub2-<name> -m "Merge P[N] sub-phase 2: <name>"
git merge --no-ff ralph/pN-sub3-<name> -m "Merge P[N] sub-phase 3: <name>"
```

Use `--no-ff` to preserve merge history so each sub-phase's work is visible as a merge commit.

## Conflict Resolution

### Prevention (first line of defense)
Each sub-phase has a declared file scope (MAY modify / MUST NOT modify). If sub-phases respect their scopes, conflicts should be rare.

### Automatic Resolution
For test-only files (files under `test/`):
```bash
git merge -X theirs ralph/pN-subM-<name>
```
Test additions are additive — taking "theirs" is safe because both sides are adding new tests.

### Manual Resolution
For source files (files under `lib/`, `app/`, `components/`):
1. Examine the conflict markers
2. Understand what each sub-phase intended
3. Combine both changes, preserving the intent of each
4. If the conflict is semantic (not just textual), launch a short fix-up Ralph Loop iteration with the conflict context

### Post-Merge Fix-Up
If the quality gate fails after all merges:
1. Examine the failure output
2. Launch ONE fix-up iteration to resolve
3. The fix-up iteration sees the merged state and fixes issues
4. If the fix-up also fails, escalate to the master orchestrator

## Validation

After merging all sub-phases:
1. Run `npm run check` (full quality gate)
2. Verify no files were modified outside declared scopes: `git diff --name-only ralph/pN-base...HEAD`
3. If scope violations found, revert those specific file changes

## Cleanup

After successful merge and gate:
```bash
# Remove worktrees
git worktree remove /tmp/csm-pN-sub1
git worktree remove /tmp/csm-pN-sub2
git worktree remove /tmp/csm-pN-sub3

# Delete sub-phase branches (merged, no longer needed)
git branch -d ralph/pN-sub1-<name>
git branch -d ralph/pN-sub2-<name>
git branch -d ralph/pN-sub3-<name>
```
