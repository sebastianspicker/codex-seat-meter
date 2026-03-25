/**
 * Runtime config from environment.
 * SEATS_DIRECTORY is required unless DEMO_MODE=1; CODEX_USAGE_* have defaults per plan.
 *
 * All env reads happen inside functions (not top-level) so that
 * changes to .env are picked up after a dev-server restart and
 * serverless cold starts always read fresh values.
 */

import path from "node:path";

let hasWarnedShortDashboardSecret = false;
const TRUE_VALUES = new Set(["1", "true", "yes"]);

export function isDemoMode(): boolean {
  const v = process.env.DEMO_MODE?.toLowerCase();
  return typeof v === "string" && TRUE_VALUES.has(v);
}

export function getSeatsDirectory(): string {
  const dir = process.env.SEATS_DIRECTORY?.trim();
  if (!dir) {
    throw new Error("SEATS_DIRECTORY is not set. Add it to .env or set DEMO_MODE=1 for mock data.");
  }
  if (!path.isAbsolute(dir)) {
    throw new Error("SEATS_DIRECTORY must be an absolute path (e.g. /home/user/seats).");
  }
  return dir;
}

const DEFAULT_USAGE_BASE = "https://chatgpt.com/backend-api";
const DEFAULT_USAGE_PATH = "wham/usage";

export function getCodexUsageUrl(): string {
  const baseUrl =
    (process.env.CODEX_USAGE_BASE_URL ?? DEFAULT_USAGE_BASE).replace(/\/$/, "");
  const usagePath =
    (process.env.CODEX_USAGE_PATH ?? DEFAULT_USAGE_PATH).replace(/^\//, "");
  const url = `${baseUrl}/${usagePath}`;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error(`CODEX_USAGE_BASE_URL must be http(s), got ${parsed.protocol}`);
    }
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Invalid CODEX_USAGE_BASE_URL or CODEX_USAGE_PATH");
    }
    throw err;
  }
  return url;
}

export function getDashboardSecret(): string | null {
  const raw = process.env.DASHBOARD_SECRET;
  const secret = typeof raw === "string" ? raw.trim() : "";
  if (secret && secret.length < 8 && !hasWarnedShortDashboardSecret) {
    hasWarnedShortDashboardSecret = true;
    console.warn("DASHBOARD_SECRET is set but very short (< 8 chars). Consider a stronger secret.");
  }
  return secret || null;
}

export function allowDashboardSecretQueryParam(): boolean {
  const explicit = process.env.ALLOW_DASHBOARD_SECRET_QUERY?.toLowerCase();
  if (typeof explicit === "string" && TRUE_VALUES.has(explicit)) {
    return true;
  }
  return process.env.NODE_ENV !== "production";
}
