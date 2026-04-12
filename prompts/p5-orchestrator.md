# Phase 5 Orchestrator: Documentation & Cleanup

You coordinate 3 parallel sub-phases for documentation, code comments, and CI/config improvements. Sub-phases run in separate git worktrees and are merged back when complete.

## Shared Protocols

Read before proceeding:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`
- `prompts/shared-merge-protocol.md`

## Sub-Phases

| Sub-Phase | Prompt | Branch | Worktree | Max Iter |
|-----------|--------|--------|----------|----------|
| 1: README & Docs | `prompts/p5-sub1-readme-docs.md` | `ralph/p5-sub1-readme-docs` | `/tmp/csm-p5-sub1` | 3 |
| 2: Code Comments | `prompts/p5-sub2-code-comments.md` | `ralph/p5-sub2-code-comments` | `/tmp/csm-p5-sub2` | 4 |
| 3: CI & Config | `prompts/p5-sub3-ci-config.md` | `ralph/p5-sub3-ci-config` | `/tmp/csm-p5-sub3` | 3 |

## Conflict Risk: MINIMAL

Sub-phases touch completely disjoint file types:
- Sub 1: Markdown files only (README.md, SECURITY.md, etc.)
- Sub 2: TypeScript/TSX files (comments only — no logic changes)
- Sub 3: Config/CI files only (.github/, package.json scripts, config files)

Zero conflict expected.

## Execution

### 1. Setup
```bash
git branch ralph/p5-base
git branch ralph/p5-sub1-readme-docs ralph/p5-base
git branch ralph/p5-sub2-code-comments ralph/p5-base
git branch ralph/p5-sub3-ci-config ralph/p5-base

git worktree add /tmp/csm-p5-sub1 ralph/p5-sub1-readme-docs
git worktree add /tmp/csm-p5-sub2 ralph/p5-sub2-code-comments
git worktree add /tmp/csm-p5-sub3 ralph/p5-sub3-ci-config

(cd /tmp/csm-p5-sub1 && npm ci)
(cd /tmp/csm-p5-sub2 && npm ci)
(cd /tmp/csm-p5-sub3 && npm ci)
```

### 2. Launch Sub-Phases
```bash
/ralph-loop "$(cat prompts/p5-sub1-readme-docs.md)" --max-iterations 3 --completion-promise "DONE"
/ralph-loop "$(cat prompts/p5-sub2-code-comments.md)" --max-iterations 4 --completion-promise "DONE"
/ralph-loop "$(cat prompts/p5-sub3-ci-config.md)" --max-iterations 3 --completion-promise "DONE"
```

### 3. Monitor
Poll for `.ralph-complete` sentinel files.

### 4. Merge
```bash
git checkout ralph/p5-base
git merge --no-ff ralph/p5-sub1-readme-docs -m "Merge P5 sub-phase 1: README & documentation"
git merge --no-ff ralph/p5-sub2-code-comments -m "Merge P5 sub-phase 2: JSDoc & code comments"
git merge --no-ff ralph/p5-sub3-ci-config -m "Merge P5 sub-phase 3: CI & config improvements"
```

### 5. Validate
```bash
npm run check
```

### 6. Cleanup
```bash
git worktree remove /tmp/csm-p5-sub1
git worktree remove /tmp/csm-p5-sub2
git worktree remove /tmp/csm-p5-sub3
git branch -d ralph/p5-sub1-readme-docs
git branch -d ralph/p5-sub2-code-comments
git branch -d ralph/p5-sub3-ci-config
```

### 7. Signal
```
<promise>DONE</promise>
```
