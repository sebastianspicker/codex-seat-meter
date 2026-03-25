# Phase 5, Sub-Phase 2: JSDoc & Code Comments

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- All `.ts` and `.tsx` files in `lib/`, `app/`, `components/`, `types/`
- COMMENTS ONLY — you must NOT change any logic, function signatures, or behavior

### Files you MUST NOT modify:
- Test files (`test/` directory)
- Config files
- Documentation files (`*.md`)
- Package files
- `.github/` directory

## Objective

Add JSDoc documentation to all exported functions and improve inline comments. This makes the codebase more maintainable and IDE-friendly.

## Tasks

1. **Module-level doc comments**:
   Add a top-of-file comment to each `lib/` module explaining its purpose:
   ```typescript
   /**
    * Seat filesystem operations — list seats, load auth JSON, validate IDs.
    * All file I/O is server-side only; tokens never reach the browser.
    * @module
    */
   ```
   Keep to 1-3 lines. Don't restate what's obvious from the filename.

2. **JSDoc for exported functions**:
   Add JSDoc to every exported function that doesn't have it:
   ```typescript
   /**
    * Fetches usage data from the Codex API with retry on transient errors.
    * Retries on 429/502/503 with exponential backoff. Times out at 8s.
    * @param token - Bearer token for API authentication
    * @param accountId - Codex account ID
    * @returns Usage response or throws on permanent failure
    */
   export async function fetchUsage(token: string, accountId: string): Promise<...>
   ```

3. **Interface/type documentation** (`types/seat.ts`):
   Add JSDoc to interfaces and their key properties:
   ```typescript
   /** Seat authentication data loaded from a JSON file on disk. */
   export interface AuthJson {
     /** Bearer token for the Codex API */
     accessToken: string;
     /** Unique identifier for this Codex account */
     accountId: string;
   }
   ```

4. **Component documentation** (`components/*.tsx`):
   Add JSDoc to component functions describing their purpose and props:
   ```typescript
   /**
    * Displays a single seat's status with balance bars, refresh controls,
    * and error indicators. Handles loading, ok, and error states.
    */
   export function SeatCard({ ... }: SeatCardProps) {
   ```

5. **Review existing inline comments**:
   - Verify they're still accurate after Phase 2/4 changes
   - Remove comments that just restate the code (`// increment i` before `i++`)
   - Keep comments that explain WHY, not WHAT
   - Update any comments that reference old code that was refactored

## Important Constraints

- **COMMENTS ONLY** — zero logic changes. If you're changing anything other than comments, you're out of scope.
- Don't add trivial comments (`/** Returns the ID */` for a function called `getId`)
- Don't add comments to every line — focus on exported APIs and complex logic
- Use proper JSDoc syntax (`@param`, `@returns`, `@throws`, `@example`)
- Keep comments concise — 1-3 lines for simple functions, up to 5 for complex ones
- Don't add `@author` or `@since` tags (they go stale quickly)

## Completion Criteria

- Every `lib/` module has a module-level doc comment
- Every exported function in `lib/` has JSDoc with `@param` and `@returns`
- All interfaces in `types/seat.ts` have JSDoc
- All component functions have JSDoc
- No stale/inaccurate inline comments remain
- `npm run check` passes (full quality gate)

## Max Iterations: 4

If you reach iteration 4 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p5-sub2.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`
2. Document one directory per iteration (`lib/` → `types/` → `components/` → `app/`)
3. Commit: `git commit -m "docs: add JSDoc to <directory>"`
4. Run `npm run check` after each commit
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
