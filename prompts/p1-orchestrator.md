# Phase 1 Orchestrator: Static Analysis & Audit

You coordinate 3 parallel sub-phases for static analysis and dependency/security auditing. Sub-phases run in separate git worktrees and are merged back when complete.

## Shared Protocols

Read before proceeding:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`
- `prompts/shared-merge-protocol.md`

## Sub-Phases

| Sub-Phase | Prompt | Branch | Worktree | Max Iter |
|-----------|--------|--------|----------|----------|
| 1: Dependency Audit | `prompts/p1-sub1-deps.md` | `ralph/p1-sub1-deps` | `/tmp/csm-p1-sub1` | 4 |
| 2: Security Scanning | `prompts/p1-sub2-security.md` | `ralph/p1-sub2-security` | `/tmp/csm-p1-sub2` | 3 |
| 3: Lint & Types | `prompts/p1-sub3-lint-types.md` | `ralph/p1-sub3-lint-types` | `/tmp/csm-p1-sub3` | 3 |

## Conflict Risk: LOW
Sub-phases touch disjoint file sets:
- Sub 1: `package.json`, `package-lock.json` only
- Sub 2: `next.config.ts`, `lib/auth.ts`, `lib/config.ts`, CI yaml
- Sub 3: All `.ts/.tsx` files, `eslint.config.mjs`, `tsconfig.json` (NOT package.json, NOT next.config.ts)

## Execution

### 1. Setup
```bash
# Create phase base branch from current HEAD
git branch ralph/p1-base

# Create sub-phase branches
git branch ralph/p1-sub1-deps ralph/p1-base
git branch ralph/p1-sub2-security ralph/p1-base
git branch ralph/p1-sub3-lint-types ralph/p1-base

# Create worktrees
git worktree add /tmp/csm-p1-sub1 ralph/p1-sub1-deps
git worktree add /tmp/csm-p1-sub2 ralph/p1-sub2-security
git worktree add /tmp/csm-p1-sub3 ralph/p1-sub3-lint-types

# Install dependencies in each worktree
(cd /tmp/csm-p1-sub1 && npm ci)
(cd /tmp/csm-p1-sub2 && npm ci)
(cd /tmp/csm-p1-sub3 && npm ci)
```

### 2. Launch Sub-Phases
Launch 3 Ralph Loops in parallel, one per worktree:
```bash
# In /tmp/csm-p1-sub1:
/ralph-loop "$(cat prompts/p1-sub1-deps.md)" --max-iterations 4 --completion-promise "DONE"

# In /tmp/csm-p1-sub2:
/ralph-loop "$(cat prompts/p1-sub2-security.md)" --max-iterations 3 --completion-promise "DONE"

# In /tmp/csm-p1-sub3:
/ralph-loop "$(cat prompts/p1-sub3-lint-types.md)" --max-iterations 3 --completion-promise "DONE"
```

### 3. Monitor
Poll for completion sentinel files:
```bash
# Check every 30 seconds
ls /tmp/csm-p1-sub1/.ralph-complete 2>/dev/null
ls /tmp/csm-p1-sub2/.ralph-complete 2>/dev/null
ls /tmp/csm-p1-sub3/.ralph-complete 2>/dev/null
```

Log progress to `prompts/.state/p1-sub1.log`, `p1-sub2.log`, `p1-sub3.log`.

### 4. Merge (once all 3 complete)
```bash
git checkout ralph/p1-base

# Merge in deterministic order per shared-merge-protocol.md
git merge --no-ff ralph/p1-sub1-deps -m "Merge P1 sub-phase 1: Dependency audit & updates"
git merge --no-ff ralph/p1-sub2-security -m "Merge P1 sub-phase 2: Security scanning"
git merge --no-ff ralph/p1-sub3-lint-types -m "Merge P1 sub-phase 3: Lint & type checking"
```

Resolve any conflicts per the merge protocol.

### 5. Validate
```bash
npm run check
```

If fails: run one fix-up iteration to resolve, then re-check.

### 6. Cleanup
```bash
git worktree remove /tmp/csm-p1-sub1
git worktree remove /tmp/csm-p1-sub2
git worktree remove /tmp/csm-p1-sub3
git branch -d ralph/p1-sub1-deps
git branch -d ralph/p1-sub2-security
git branch -d ralph/p1-sub3-lint-types
```

### 7. Signal
```
<promise>DONE</promise>
```
