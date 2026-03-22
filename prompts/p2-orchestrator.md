# Phase 2 Orchestrator: Code Quality & Refactoring

You coordinate 3 parallel sub-phases for code quality improvements and refactoring. Sub-phases run in separate git worktrees and are merged back when complete.

## Shared Protocols

Read before proceeding:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`
- `prompts/shared-merge-protocol.md`

## Sub-Phases

| Sub-Phase | Prompt | Branch | Worktree | Max Iter |
|-----------|--------|--------|----------|----------|
| 1: Code Patterns | `prompts/p2-sub1-patterns.md` | `ralph/p2-sub1-patterns` | `/tmp/csm-p2-sub1` | 5 |
| 2: Dead Code | `prompts/p2-sub2-dead-code.md` | `ralph/p2-sub2-dead-code` | `/tmp/csm-p2-sub2` | 3 |
| 3: Error Handling | `prompts/p2-sub3-error-handling.md` | `ralph/p2-sub3-error-handling` | `/tmp/csm-p2-sub3` | 4 |

## Conflict Risk: MEDIUM

Sub 1 (patterns/refactoring) and Sub 3 (error handling) may both touch files in `lib/`. Mitigation:
- Sub 1 focuses on **structural** changes (extracting hooks, component patterns)
- Sub 3 focuses on **error handling logic** (catch blocks, error messages)
- Merge order: Sub 1 first — structural changes land first, error handling applies on top
- If conflicts arise during merge, launch a fix-up iteration

## Execution

### 1. Setup
```bash
git branch ralph/p2-base
git branch ralph/p2-sub1-patterns ralph/p2-base
git branch ralph/p2-sub2-dead-code ralph/p2-base
git branch ralph/p2-sub3-error-handling ralph/p2-base

git worktree add /tmp/csm-p2-sub1 ralph/p2-sub1-patterns
git worktree add /tmp/csm-p2-sub2 ralph/p2-sub2-dead-code
git worktree add /tmp/csm-p2-sub3 ralph/p2-sub3-error-handling

(cd /tmp/csm-p2-sub1 && npm ci)
(cd /tmp/csm-p2-sub2 && npm ci)
(cd /tmp/csm-p2-sub3 && npm ci)
```

### 2. Launch Sub-Phases
```bash
# In /tmp/csm-p2-sub1:
/ralph-loop "$(cat prompts/p2-sub1-patterns.md)" --max-iterations 5 --completion-promise "DONE"

# In /tmp/csm-p2-sub2:
/ralph-loop "$(cat prompts/p2-sub2-dead-code.md)" --max-iterations 3 --completion-promise "DONE"

# In /tmp/csm-p2-sub3:
/ralph-loop "$(cat prompts/p2-sub3-error-handling.md)" --max-iterations 4 --completion-promise "DONE"
```

### 3. Monitor
Poll for `.ralph-complete` sentinel files in each worktree.
Log progress to `prompts/.state/p2-sub{1,2,3}.log`.

### 4. Merge
```bash
git checkout ralph/p2-base
git merge --no-ff ralph/p2-sub1-patterns -m "Merge P2 sub-phase 1: Code patterns & anti-patterns"
git merge --no-ff ralph/p2-sub2-dead-code -m "Merge P2 sub-phase 2: Dead code removal"
git merge --no-ff ralph/p2-sub3-error-handling -m "Merge P2 sub-phase 3: Error handling improvements"
```

**Important**: If conflicts arise between Sub 1 and Sub 3 (likely in `lib/usage-client.ts` or `lib/seat-status-service.ts`), prefer Sub 3's error handling changes where they conflict with Sub 1's structural changes. Sub 3's changes are safety-critical.

### 5. Validate
```bash
npm run check
```

### 6. Cleanup
```bash
git worktree remove /tmp/csm-p2-sub1
git worktree remove /tmp/csm-p2-sub2
git worktree remove /tmp/csm-p2-sub3
git branch -d ralph/p2-sub1-patterns
git branch -d ralph/p2-sub2-dead-code
git branch -d ralph/p2-sub3-error-handling
```

### 7. Signal
```
<promise>DONE</promise>
```
