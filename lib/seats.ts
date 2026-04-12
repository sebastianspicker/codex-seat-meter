/**
 * Filesystem access for seat auth files.
 * Handles listing, loading, and path-traversal protection.
 */
import { readdir, readFile, access } from "fs/promises";
import { constants } from "fs";
import path from "path";
import { isAuthJson } from "@/lib/seat-guards";
import type { AuthJson, SeatMeta } from "@/types/seat";
import { getErrorMessage } from "@/lib/errors";

/** Max length for a seat id (filename without extension) to avoid path length abuse. */
const MAX_SEAT_ID_LENGTH = 200;
const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F]/;

export function isSafeSeatId(seatId: string): boolean {
  return Boolean(
    seatId &&
      seatId.length <= MAX_SEAT_ID_LENGTH &&
      seatId === seatId.trim() &&
      !CONTROL_CHAR_RE.test(seatId) &&
      !seatId.includes("/") &&
      !seatId.includes("\\") &&
      !seatId.includes("..")
  );
}

/**
 * Resolve seat id to absolute path of auth json (only within configured directory).
 */
export function getSeatAuthPath(seatsDirectory: string, seatId: string): string {
  if (!isSafeSeatId(seatId)) {
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
    console.error("[seats] SEATS_DIRECTORY does not exist or is not readable");
    throw new Error("Seats directory is not accessible. Check that SEATS_DIRECTORY points to an existing, readable folder.");
  }
  const entries = await readdir(base, { withFileTypes: true });
  const results: SeatMeta[] = [];

  for (const ent of entries) {
    if (!ent.isFile() || !ent.name.endsWith(".json")) continue;
    const id = ent.name.replace(/\.json$/i, "");
    if (!isSafeSeatId(id)) {
      results.push({ id, error: "Invalid seat id in filename" });
      continue;
    }
    const filePath = path.join(base, ent.name);
    try {
      const raw = await readFile(filePath, "utf-8");
      const parsed: unknown = JSON.parse(raw);
      if (!isAuthJson(parsed)) {
        results.push({
          id,
          error: "Invalid auth file format (expected JSON object with optional tokens)",
        });
        continue;
      }
      const authMode = parsed.auth_mode;
      const lastRefresh = parsed.last_refresh;
      results.push({
        id,
        auth_mode: typeof authMode === "string" ? authMode : undefined,
        last_refresh: typeof lastRefresh === "string" ? lastRefresh : undefined,
      });
    } catch (err: unknown) {
      console.error(`[seats] Failed to read seat file: ${getErrorMessage(err, "Unknown error")}`);
      results.push({
        id,
        error: "Failed to read seat configuration",
      });
    }
  }

  results.sort((a, b) => a.id.localeCompare(b.id));
  return results;
}

/**
 * Load auth.json for a seat and return validated AuthJson.
 */
export async function loadSeatAuth(
  seatsDirectory: string,
  seatId: string
): Promise<AuthJson> {
  const filePath = getSeatAuthPath(seatsDirectory, seatId);
  const raw = await readFile(filePath, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  if (!isAuthJson(parsed)) {
    throw new Error("Invalid auth file format");
  }
  return parsed;
}
