// @vitest-environment node

import { describe, expect, it } from "vitest";
import { getSeatAuthPath } from "@/lib/seats";

describe("getSeatAuthPath", () => {
  const base = "/tmp/seats";

  it("builds a seat file path for valid ids", () => {
    expect(getSeatAuthPath(base, "team-alpha")).toBe("/tmp/seats/team-alpha.json");
  });

  it("rejects traversal and path separators", () => {
    const invalidIds = ["../x", "a/b", "a\\b", "a..b", `x\u0000y`, " bad", "bad ", "bad\nseat"];
    invalidIds.forEach((id) => {
      expect(() => getSeatAuthPath(base, id)).toThrow("Invalid seat id");
    });
  });

  it("rejects overlong ids", () => {
    const tooLong = "x".repeat(201);
    expect(() => getSeatAuthPath(base, tooLong)).toThrow("Invalid seat id");
  });

  it("rejects empty string seat id", () => {
    expect(() => getSeatAuthPath(base, "")).toThrow("Invalid seat id");
  });

  it("accepts seat id with Unicode characters (emoji, CJK)", () => {
    // isSafeSeatId allows Unicode; only control chars, path seps, and ".." are blocked
    const emojiId = "seat-\u{1F680}";
    expect(getSeatAuthPath(base, emojiId)).toBe(`/tmp/seats/${emojiId}.json`);

    const cjkId = "\u4F60\u597D-seat";
    expect(getSeatAuthPath(base, cjkId)).toBe(`/tmp/seats/${cjkId}.json`);
  });

  it("accepts seat id at max allowed length (200 chars)", () => {
    const maxId = "a".repeat(200);
    expect(getSeatAuthPath(base, maxId)).toBe(`/tmp/seats/${maxId}.json`);
  });

  it("rejects seat id at 201 chars (just over max)", () => {
    const overMax = "a".repeat(201);
    expect(() => getSeatAuthPath(base, overMax)).toThrow("Invalid seat id");
  });

  it("accepts seat id with URL-encoded-style characters (literal percent signs)", () => {
    // Percent-encoded strings like "team%20alpha" are treated as literal filenames
    const urlEncodedId = "team%20alpha";
    expect(getSeatAuthPath(base, urlEncodedId)).toBe(`/tmp/seats/${urlEncodedId}.json`);
  });
});
