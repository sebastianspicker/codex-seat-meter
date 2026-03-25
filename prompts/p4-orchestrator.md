# Phase 4 Orchestrator: Bug & Issue Fixing

You coordinate 3 parallel sub-phases for fixing bugs, resolving TODOs, and addressing information disclosure. Sub-phases run in separate git worktrees and are merged back when complete.

## Shared Protocols

Read before proceeding:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`
- `prompts/shared-merge-protocol.md`

## Sub-Phases

| Sub-Phase | Prompt | Branch | Worktree | Max Iter |
|-----------|--------|--------|----------|----------|
| 1: TODO Resolution | `prompts/p4-sub1-todos.md` | `ralph/p4-sub1-todos` | `/tmp/csm-p4-sub1` | 3 |
| 2: Bug Fixes | `prompts/p4-sub2-bug-fixes.md` | `ralph/p4-sub2-bug-fixes` | `/tmp/csm-p4-sub2` | 4 |
| 3: Info Disclosure | `prompts/p4-sub3-info-disclosure.md` | `ralph/p4-sub3-info-disclosure` | `/tmp/csm-p4-sub3` | 3 |

## Conflict Risk: LOW

- Sub 1 (TODOs): Will likely find zero TODOs. If it finds "should-be-TODO" patterns, they'll be in different locations than Sub 2 or Sub 3.
- Sub 2 (bug fixes): Focuses on functional correctness — logic bugs, race conditions.
- Sub 3 (info disclosure): Focuses on logging and error messages — different concern from Sub 2.

Overlap is possible in `lib/seat-status-service.ts` (Sub 2 correctness + Sub 3 error messages). Merge order handles this: Sub 2's correctness fixes land first, Sub 3's message sanitization applies on top.

## Execution

### 1. Setup
```bash
git branch ralph/p4-base
git branch ralph/p4-sub1-todos ralph/p4-base
git branch ralph/p4-sub2-bug-fixes ralph/p4-base
git branch ralph/p4-sub3-info-disclosure ralph/p4-base

git worktree add /tmp/csm-p4-sub1 ralph/p4-sub1-todos
git worktree add /tmp/csm-p4-sub2 ralph/p4-sub2-bug-fixes
git worktree add /tmp/csm-p4-sub3 ralph/p4-sub3-info-disclosure

(cd /tmp/csm-p4-sub1 && npm ci)
(cd /tmp/csm-p4-sub2 && npm ci)
(cd /tmp/csm-p4-sub3 && npm ci)
```

### 2. Launch Sub-Phases
```bash
/ralph-loop "$(cat prompts/p4-sub1-todos.md)" --max-iterations 3 --completion-promise "DONE"
/ralph-loop "$(cat prompts/p4-sub2-bug-fixes.md)" --max-iterations 4 --completion-promise "DONE"
/ralph-loop "$(cat prompts/p4-sub3-info-disclosure.md)" --max-iterations 3 --completion-promise "DONE"
```

### 3. Monitor
Poll for `.ralph-complete` sentinel files.

### 4. Merge
```bash
git checkout ralph/p4-base
git merge --no-ff ralph/p4-sub1-todos -m "Merge P4 sub-phase 1: TODO/FIXME resolution"
git merge --no-ff ralph/p4-sub2-bug-fixes -m "Merge P4 sub-phase 2: Bug fixes & regression checks"
git merge --no-ff ralph/p4-sub3-info-disclosure -m "Merge P4 sub-phase 3: Information disclosure fixes"
```

### 5. Validate
```bash
npm run check
```

### 6. Cleanup
```bash
git worktree remove /tmp/csm-p4-sub1
git worktree remove /tmp/csm-p4-sub2
git worktree remove /tmp/csm-p4-sub3
git branch -d ralph/p4-sub1-todos
git branch -d ralph/p4-sub2-bug-fixes
git branch -d ralph/p4-sub3-info-disclosure
```

### 7. Signal
```
<promise>DONE</promise>
```
