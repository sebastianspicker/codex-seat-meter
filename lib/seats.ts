import { readdir, readFile, access } from "fs/promises";
import { constants } from "fs";
import path from "path";
import type { AuthJson, SeatMeta } from "@/types/seat";

/**
 * Resolve seat id to absolute path of auth json (only within configured directory).
 */
export function getSeatAuthPath(seatsDirectory: string, seatId: string): string {
  if (!seatId || seatId.includes("/") || seatId.includes("\\") || seatId.includes("..") || seatId.includes("\0")) {
    throw new Error("Invalid seat id");
  }
  const base = path.resolve(seatsDirectory);
  const candidate = path.resolve(base, `${seatId}.json`);
  const baseWithSep = base.endsWith(path.sep) ? base : base + path.sep;
  if (!candidate.startsWith(baseWithSep)) {
    throw new Error("Invalid seat id");
  }
  return candidate;
}

/**
 * List all seat ids and load safe metadata from the configured directory.
 * Only reads *.json files; returns id = filename without extension.
 */
export async function listSeats(seatsDirectory: string): Promise<SeatMeta[]> {
  const base = path.resolve(seatsDirectory);
  try {
    await access(base, constants.R_OK);
  } catch {
    throw new Error(
      `SEATS_DIRECTORY "${base}" does not exist or is not readable. ` +
      `Create the directory and add auth JSON files, or update SEATS_DIRECTORY in .env.`
    );
  }
  const entries = await readdir(base, { withFileTypes: true });
  const results: SeatMeta[] = [];

  for (const ent of entries) {
    if (!ent.isFile() || !ent.name.endsWith(".json")) continue;
    const id = ent.name.replace(/\.json$/i, "");
    const filePath = path.join(base, ent.name);
    try {
      const raw = await readFile(filePath, "utf-8");
      const auth = JSON.parse(raw) as AuthJson;
      results.push({
        id,
        auth_mode: auth.auth_mode,
        last_refresh: auth.last_refresh,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error(`Failed to read seat ${id} from ${filePath}:`, err);
      results.push({
        id,
        auth_mode: undefined,
        last_refresh: undefined,
        error: `Failed to parse: ${msg}`,
      });
    }
  }

  results.sort((a, b) => a.id.localeCompare(b.id));
  return results;
}

/**
 * Load auth.json for a seat and return parsed AuthJson (includes tokens).
 */
export async function loadSeatAuth(
  seatsDirectory: string,
  seatId: string
): Promise<AuthJson> {
  const filePath = getSeatAuthPath(seatsDirectory, seatId);
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as AuthJson;
}
