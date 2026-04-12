# Security Audit Report

**Date:** 2026-03-22
**Branch:** `codex/repo-cleanup-refactor-upgrade`
**Auditor:** Automated security scan (Phase 1, Sub-Phase 2)

---

## Summary

- **Prior findings verified:** 12 of 12
- **New HIGH severity findings:** 0
- **New INFO-level observations:** 4
- **`npm run check` result:** PASS (lint, typecheck, 36 tests, build)

---

## Prior Finding Verification

### VERIFIED: P2-1 -- Stale status contamination in dashboard aggregates

- **File:** `lib/dashboard-stats.ts`
- **Status:** Fixed. The `computeDashboardStats` function builds an `activeIds` set from seats without file errors (line 21) and skips statuses for seats not in that set (line 24). Stale statuses for errored seats are excluded from aggregates.

### VERIFIED: P2-2 -- Batch endpoint controls

- **File:** `app/api/seats/statuses/route.ts`
- **Status:** Fixed. `MAX_BATCH_IDS = 50` (line 7) caps incoming ID count, `FETCH_CONCURRENCY = 5` (line 8) limits upstream fan-out. IDs are validated via `isValidSeatId()` (line 43). Legacy `ids=` comma-split path does not double-decode (line 24-28).

### VERIFIED: P2-3 -- Secret query parameter leakage

- **File:** `app/page.tsx` (lines 332-339), `app/layout.tsx` (line 8), `next.config.ts` (line 24)
- **Status:** Fixed. Secret is captured once from `searchParams`, then immediately removed from the URL via `history.replaceState`. Referrer policy set to `no-referrer` in both metadata and HTTP response headers.

### VERIFIED: P2-5 -- Secret in API query string

- **File:** `lib/api-auth.ts`, `lib/api-urls.ts`
- **Status:** Fixed. `getDashboardAuthRequestInit()` sends the secret exclusively via the `x-dashboard-secret` header. URL builder functions (`getSeatsUrl`, `getSeatStatusUrl`, `getSeatStatusesUrl`) do not accept or append a secret parameter.

### VERIFIED: P2-6 -- CSP configured only as metadata (not HTTP header)

- **File:** `next.config.ts` (lines 3-15, 18-34)
- **Status:** Fixed. CSP is set as an HTTP response header via `next.config.ts` `headers()` function, applied to all routes (`/:path*`). Includes `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, and `upgrade-insecure-requests`.

### VERIFIED: P2-7 -- Auth load error mapping

- **File:** `lib/seat-status-service.ts` (lines 53-71)
- **Status:** Fixed. Auth-load errors are differentiated: `ENOENT` returns 404, messages starting with `Invalid ` return 400, all other errors return 500.

### VERIFIED: P2-8 -- Query-param secret gate

- **File:** `lib/config.ts` (lines 64-70), `lib/auth.ts` (lines 29-31)
- **Status:** Fixed. `allowDashboardSecretQueryParam()` returns `false` in production by default. Query-param secret is only accepted when `ALLOW_DASHBOARD_SECRET_QUERY=1` or `NODE_ENV !== "production"`.

### VERIFIED: P3-5 -- Missing baseline hardening headers

- **File:** `next.config.ts` (lines 22-31)
- **Status:** Fixed. The following headers are set globally:
  - `Content-Security-Policy` (comprehensive policy)
  - `Referrer-Policy: no-referrer`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()`

### VERIFIED: P3-6 -- Demo mode seat validation

- **File:** `lib/seat-status-service.ts` (lines 25-28)
- **Status:** Fixed. Demo mode checks `MOCK_SEATS.some((seat) => seat.id === seatId)` and returns 404 for unknown seat IDs.

### VERIFIED: P3-7 -- Safe localStorage

- **File:** `lib/storage.ts`
- **Status:** Fixed. `safeReadLocalStorage` and `safeWriteLocalStorage` wrap `localStorage` operations in try/catch with SSR guard (`typeof window === "undefined"`). Used by `app/page.tsx` for preference read/write.

### VERIFIED: P3-9 -- Seat ID validation

- **File:** `lib/seats.ts` (lines 12-22)
- **Status:** Fixed. `isSafeSeatId()` rejects: empty strings, length > 200, leading/trailing whitespace (`seatId === seatId.trim()`), control characters (`\u0000-\u001F`, `\u007F`), path separators (`/`, `\\`), and directory traversal (`..`).

### VERIFIED: P3-10 -- Absolute SEATS_DIRECTORY

- **File:** `lib/config.ts` (lines 25-27)
- **Status:** Fixed. `getSeatsDirectory()` uses `path.isAbsolute(dir)` and throws `"SEATS_DIRECTORY must be an absolute path"` for relative paths.

---

## New Findings

### INFO-1: CSP `connect-src` includes unnecessary external origin

- **Severity:** INFO
- **File:** `next.config.ts` (line 9)
- **Detail:** `connect-src 'self' https://chatgpt.com` includes `https://chatgpt.com`, but all browser-to-server fetches go to `'self'` (API routes). The upstream chatgpt.com fetch happens server-side in `lib/usage-client.ts`, not from the browser. Including the external origin slightly widens the CSP beyond what the browser requires.
- **Recommendation:** Consider removing `https://chatgpt.com` from `connect-src` to tighten CSP. No browser-side code connects to it directly.

### INFO-2: CSP `script-src` includes `'unsafe-inline'`

- **Severity:** INFO
- **File:** `next.config.ts` (line 5)
- **Detail:** `script-src 'self' 'unsafe-inline'` is required for Next.js to function without nonce-based CSP configuration. This is a known framework constraint.
- **Recommendation:** For maximum CSP strictness, consider nonce-based script loading via Next.js experimental CSP nonce support. Current setting is acceptable for the threat model.

### INFO-3: No `Strict-Transport-Security` (HSTS) header

- **Severity:** INFO
- **File:** `next.config.ts`
- **Detail:** HSTS is not set in the application's response headers. For a locally-hosted dashboard, this is expected. In production behind HTTPS, HSTS is typically configured at the reverse proxy or CDN layer.
- **Recommendation:** If deployed publicly over HTTPS, add `Strict-Transport-Security: max-age=63072000; includeSubDomains` either in `next.config.ts` headers or at the infrastructure level.

### INFO-4: Timing-safe auth comparison uses SHA-256 intermediary

- **Severity:** INFO
- **File:** `lib/auth.ts` (lines 7-9, 33-50)
- **Detail:** The auth guard hashes both the stored secret and the provided value with SHA-256 before calling `timingSafeEqual`. This is a correct approach that avoids length-probing attacks (since SHA-256 output is always 32 bytes). Implementation is sound.
- **Recommendation:** None. This is a positive observation.

---

## Supply Chain and CI Review

### CI Workflow (`.github/workflows/ci.yml`)

| Check | Status |
|-------|--------|
| Top-level `permissions: {}` (least privilege) | PASS |
| Job-level `permissions: { contents: read }` | PASS |
| Action `actions/checkout` pinned to SHA (`11bd719...`) | PASS |
| Action `actions/setup-node` pinned to SHA (`4993ea5...`) | PASS |
| `persist-credentials: false` on checkout | PASS |
| `npm ci --ignore-scripts` (no postinstall execution) | PASS |
| `npm audit --omit=dev --audit-level=high` | PASS |
| `timeout-minutes: 10` | PASS |
| Concurrency group with `cancel-in-progress: true` | PASS |

### Dependabot (`.github/dependabot.yml`)

| Check | Status |
|-------|--------|
| npm ecosystem configured | PASS |
| github-actions ecosystem configured | PASS |
| Weekly schedule for both | PASS |
| Production/dev dependency groups | PASS |

### Secret and Credential Scan

| Check | Status |
|-------|--------|
| No hardcoded API keys (`sk-`, `eyJ...`) in source | PASS |
| No hardcoded tokens or passwords in source | PASS |
| `.env`, `.env.*`, `*.pem`, `*.key`, `credentials.json`, `secrets.json` in `.gitignore` | PASS |
| `.env.example` contains only placeholder comments | PASS |
| Demo data (`demo/seats/*.json`) contains no real tokens | PASS |

### HTTP Security Headers

| Header | Value | Status |
|--------|-------|--------|
| `Content-Security-Policy` | Comprehensive policy with `frame-ancestors 'none'`, `object-src 'none'` | PASS |
| `Referrer-Policy` | `no-referrer` (header + metadata) | PASS |
| `X-Content-Type-Options` | `nosniff` | PASS |
| `X-Frame-Options` | `DENY` | PASS |
| `Permissions-Policy` | Restricts camera, microphone, geolocation, payment, USB | PASS |
| `Strict-Transport-Security` | Not set (acceptable for local deployment) | INFO |

---

## Conclusion

All 12 prior findings from `INSPECTION-FINDINGS.md` are confirmed fixed in the current codebase. No new HIGH severity issues were identified. The 4 INFO-level observations are minor hardening opportunities, none requiring immediate action. The CI pipeline is well-configured with SHA-pinned actions, least-privilege permissions, and supply-chain protections.
