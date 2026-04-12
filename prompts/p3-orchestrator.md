# Phase 3 Orchestrator: Testing & Coverage

You coordinate 3 parallel sub-phases for expanding test coverage. Sub-phases run in separate git worktrees and are merged back when complete.

## Shared Protocols

Read before proceeding:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`
- `prompts/shared-merge-protocol.md`

## Sub-Phases

| Sub-Phase | Prompt | Branch | Worktree | Max Iter |
|-----------|--------|--------|----------|----------|
| 1: Unit Test Gaps | `prompts/p3-sub1-unit-gaps.md` | `ralph/p3-sub1-unit-gaps` | `/tmp/csm-p3-sub1` | 6 |
| 2: E2E Tests | `prompts/p3-sub2-e2e.md` | `ralph/p3-sub2-e2e` | `/tmp/csm-p3-sub2` | 5 |
| 3: Edge Cases | `prompts/p3-sub3-edge-cases.md` | `ralph/p3-sub3-edge-cases` | `/tmp/csm-p3-sub3` | 4 |

## Conflict Risk: LOW

Sub-phases are designed to touch disjoint file sets:
- Sub 1: Creates NEW test files only (for untested modules)
- Sub 2: Creates NEW `test/e2e/` files + `playwright.config.ts` + adds npm script
- Sub 3: Adds tests to EXISTING test files only

The only potential overlap: Sub 1 might create a test file that Sub 3 also wants to add edge cases to. Mitigation: Sub 1's files are for previously untested modules; Sub 3 adds to already-tested modules.

## Execution

### 1. Setup
```bash
git branch ralph/p3-base
git branch ralph/p3-sub1-unit-gaps ralph/p3-base
git branch ralph/p3-sub2-e2e ralph/p3-base
git branch ralph/p3-sub3-edge-cases ralph/p3-base

git worktree add /tmp/csm-p3-sub1 ralph/p3-sub1-unit-gaps
git worktree add /tmp/csm-p3-sub2 ralph/p3-sub2-e2e
git worktree add /tmp/csm-p3-sub3 ralph/p3-sub3-edge-cases

(cd /tmp/csm-p3-sub1 && npm ci)
(cd /tmp/csm-p3-sub2 && npm ci)
(cd /tmp/csm-p3-sub3 && npm ci)
```

### 2. Launch Sub-Phases
```bash
/ralph-loop "$(cat prompts/p3-sub1-unit-gaps.md)" --max-iterations 6 --completion-promise "DONE"
/ralph-loop "$(cat prompts/p3-sub2-e2e.md)" --max-iterations 5 --completion-promise "DONE"
/ralph-loop "$(cat prompts/p3-sub3-edge-cases.md)" --max-iterations 4 --completion-promise "DONE"
```

### 3. Monitor
Poll for `.ralph-complete` sentinel files.

### 4. Merge
```bash
git checkout ralph/p3-base
git merge --no-ff ralph/p3-sub1-unit-gaps -m "Merge P3 sub-phase 1: Unit test gap filling"
git merge --no-ff ralph/p3-sub2-e2e -m "Merge P3 sub-phase 2: E2E test creation"
git merge --no-ff ralph/p3-sub3-edge-cases -m "Merge P3 sub-phase 3: Edge case testing"
```

For test file conflicts (most likely): use `git merge -X theirs` since both sides are adding tests.

### 5. Validate
```bash
npm run check
```

### 6. Cleanup
```bash
git worktree remove /tmp/csm-p3-sub1
git worktree remove /tmp/csm-p3-sub2
git worktree remove /tmp/csm-p3-sub3
git branch -d ralph/p3-sub1-unit-gaps
git branch -d ralph/p3-sub2-e2e
git branch -d ralph/p3-sub3-edge-cases
```

### 7. Signal
```
<promise>DONE</promise>
```
