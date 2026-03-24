// @vitest-environment node

import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/lib/errors";

describe("getErrorMessage - extended", () => {
  it("extracts message from an object with .message string (non-Error)", () => {
    const obj = { message: "custom error message" };
    expect(getErrorMessage(obj, "fallback")).toBe("custom error message");
  });

  it("returns fallback for an object with non-string .message", () => {
    const obj = { message: 123 };
    expect(getErrorMessage(obj, "fallback")).toBe("fallback");
  });

  it("returns fallback for undefined", () => {
    expect(getErrorMessage(undefined, "default")).toBe("default");
  });

  it("returns fallback for a string thrown value", () => {
    expect(getErrorMessage("error string", "default")).toBe("default");
  });

  it("returns fallback for a number thrown value", () => {
    expect(getErrorMessage(42, "default")).toBe("default");
  });

  it("returns fallback for null", () => {
    expect(getErrorMessage(null, "default")).toBe("default");
  });
});
