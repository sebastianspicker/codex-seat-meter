/**
 * Runtime config from environment.
 * SEATS_DIRECTORY is required; CODEX_USAGE_* have defaults per plan.
 *
 * All env reads happen inside functions (not top-level) so that
 * changes to .env are picked up after a dev-server restart and
 * serverless cold starts always read fresh values.
 */

export function getSeatsDirectory(): string {
  const dir = process.env.SEATS_DIRECTORY?.trim();
  if (!dir) {
    throw new Error("SEATS_DIRECTORY is not set");
  }
  return dir;
}

export function getCodexUsageUrl(): string {
  const baseUrl =
    (process.env.CODEX_USAGE_BASE_URL ?? "https://chatgpt.com/backend-api").replace(/\/$/, "");
  const usagePath =
    (process.env.CODEX_USAGE_PATH ?? "wham/usage").replace(/^\//, "");
  return `${baseUrl}/${usagePath}`;
}
