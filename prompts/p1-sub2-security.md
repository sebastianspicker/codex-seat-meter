# Phase 1, Sub-Phase 2: Security Scanning

## Context

You are working on the codex-seat-meter repository — a Next.js 16 / React 19 / TypeScript dashboard.
This is a Ralph Loop iteration. Check `git log` and `git diff` to see what you've done in previous iterations.

The repo has already undergone a thorough 10-pass security inspection (documented in `INSPECTION-FINDINGS.md`). Your job is to verify those fixes and look for anything new.

Read the shared protocols:
- `prompts/shared-completion-protocol.md`
- `prompts/shared-quality-gate.md`

## Scope

### Files you MAY modify:
- `next.config.ts` (CSP headers, security headers)
- `lib/auth.ts` (auth guard logic)
- `lib/config.ts` (configuration validation)
- `.github/workflows/ci.yml` (CI security steps)
- May CREATE: `SECURITY-AUDIT.md` (findings report)

### Files you MUST NOT modify:
- `package.json`, `package-lock.json` (handled by sub-phase 1)
- Component files, test files
- `eslint.config.mjs`, `tsconfig.json` (handled by sub-phase 3)

## Objective

Perform a security review of the codebase, verify prior findings are fixed, and identify any new security concerns.

## Tasks

1. **CSP Header Review** (`next.config.ts`):
   - Verify Content-Security-Policy is comprehensive
   - Check for overly permissive directives (`unsafe-inline`, `unsafe-eval`)
   - Verify `connect-src` only allows necessary origins
   - Ensure CSP is applied via HTTP header, not just HTML meta tag

2. **Authentication Flow** (`lib/auth.ts`):
   - Verify constant-time comparison (timingSafeEqual) is used correctly
   - Check for timing attack vectors
   - Verify header-based auth (`x-dashboard-secret`) is the primary method
   - Confirm query-param secret is disabled in production (unless explicitly opted in)

3. **Secrets & Credentials**:
   - Scan all source files for hardcoded secrets, API keys, tokens
   - Verify `.env.example` doesn't contain real values
   - Check that no tokens are sent to the browser (server-side only)
   - Verify `demo/` files don't contain real credentials

4. **HTTP Headers** (`next.config.ts`):
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: no-referrer`
   - `Permissions-Policy` restricts dangerous features
   - HSTS header consideration

5. **Error Message Leakage** (read-only scan of `lib/` and `app/api/`):
   - Identify any error messages that expose internal paths, config, or stack traces
   - Document findings (fixes will be done in Phase 4, sub-phase 3)
   - Do NOT fix these yourself — just document them in the audit report

6. **CI Security** (`.github/workflows/ci.yml`):
   - Verify action versions are pinned to SHA (not branch tags)
   - Verify `persist-credentials: false` on checkout
   - Verify minimal permissions
   - Check for command injection vectors in workflow definitions

7. **Write Audit Report**:
   - Create `SECURITY-AUDIT.md` with all findings
   - Categorize as: VERIFIED (prior fix confirmed), NEW (new finding), INFO (observation)
   - Include severity rating for any NEW findings

## Completion Criteria

- All 12 prior inspection findings (P2-1 through P3-12) verified as fixed
- `SECURITY-AUDIT.md` written with categorized findings
- Any HIGH severity NEW findings fixed
- Medium/Low findings documented for later phases
- `npm run check` passes

## Max Iterations: 3

If you reach iteration 3 without completing:
- Signal `<promise>DONE_PARTIAL</promise>`
- Create `REMAINING-WORK-p1-sub2.md`

## Iteration Protocol

1. Check previous work: `git log --oneline -5`, `git diff HEAD~1`
2. Determine what remains from the task list above
3. Make incremental progress (one task area per iteration)
4. Run `npm run check` after any modifications
5. If all criteria met: `<promise>DONE</promise>`
6. If not done: end normally (stop hook re-invokes you)
