# Phase 3, Sub-Phase 3: Edge Case & Boundary Testing

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- EXISTING test files in `test/lib/` (add new test cases to existing describe blocks)
- EXISTING test files in `test/api/` (add new test cases)

### Files you MUST NOT modify:
- Source files (no production code changes)
- NEW test files (sub-phase 1 creates those)
- `test/e2e/` directory (sub-phase 2's scope)
- Config files, package files

## Objective

Add edge case and boundary tests to the existing test suite. Focus on inputs that are unusual, extreme, or at boundaries of validation logic.

## Existing Test Files to Augment

- `test/lib/api-auth.test.ts`
- `test/lib/api-urls.test.ts`
- `test/lib/auth.test.ts`
- `test/lib/config.test.ts`
- `test/lib/dashboard-controls.test.ts`
- `test/lib/dashboard-stats.test.ts`
- `test/lib/seat-status-service.test.ts`
- `test/lib/seats.test.ts`
- `test/lib/storage.test.ts`
- `test/lib/usage-mapper.test.ts`
- `test/api/statuses-route.test.ts`

## Edge Cases to Test

### `seats.test.ts` — Seat ID validation
- Empty string seat ID
- Seat ID with only whitespace
- Seat ID with Unicode characters (emoji, CJK, RTL)
- Seat ID with null bytes
- Seat ID at maximum reasonable length (255 chars)
- Seat ID with URL-encoded characters (`%2F`, `%00`)

### `statuses-route.test.ts` — Batch endpoint boundaries
- Request with 0 seat IDs
- Request with exactly 50 seat IDs (the max)
- Request with 51 seat IDs (should reject)
- Request with duplicate seat IDs (should deduplicate)
- Request with mix of valid and invalid seat IDs

### `usage-mapper.test.ts` — Extreme values
- Usage response with NaN values
- Usage response with Infinity values
- Usage response with negative percentages
- Usage response with 0% remaining (fully consumed)
- Usage response with 100% remaining (unused)
- Usage response with missing/null fields
- Usage response with extra unexpected fields

### `dashboard-stats.test.ts` — Aggregation edge cases
- Empty seat list
- Single seat
- All seats in error state
- Mix of stale and fresh statuses
- Seats with undefined/null credit values

### `dashboard-controls.test.ts` — Filter/sort boundaries
- Filter with empty results (all seats filtered out)
- Sort with identical values (stable sort check)
- Search with special regex characters (`.`, `*`, `[`)
- Search with empty string
- Search with very long query

### `auth.test.ts` — Auth edge cases
- Empty secret string
- Secret with special characters (Unicode, null bytes)
- Very long secret (10KB+)
- Missing header entirely vs. empty header value
- Header with extra whitespace

### `config.test.ts` — Config edge cases
- SEATS_DIRECTORY with trailing slash
- SEATS_DIRECTORY with spaces in path
- SEATS_DIRECTORY pointing to non-existent location
- AUTO_REFRESH_INTERVAL_MS at boundaries (4999, 5000, 300000, 300001)

### `storage.test.ts` — localStorage edge cases
- localStorage throws on setItem (quota exceeded)
- localStorage returns null for existing key
- Value that exceeds typical storage limits
- Concurrent read/write simulation

## Important Constraints

- Add tests to EXISTING describe blocks — don't create new top-level describes
- Follow the existing test naming pattern in each file
- Each edge case test should have a clear description of WHAT edge case it covers
- Tests should be independent — no shared mutable state
- If an edge case reveals a bug, document it as a comment: `// BUG: [description]` but still write the test (it may fail — that's Phase 4's job to fix)

## Completion Criteria

- At least 5 of the 11 existing test files augmented with edge cases
- At least 30 new edge case test assertions added total
- All new tests pass (unless they reveal actual bugs, which are documented)
- `npm run check` passes (full quality gate)

## Max Iterations: 4

If you reach iteration 4 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p3-sub3.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`
2. Augment 2-3 test files per iteration
3. Run `npx vitest run` to verify
4. Commit: `git commit -m "test: add edge cases for <module>"`
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
