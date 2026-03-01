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
});
