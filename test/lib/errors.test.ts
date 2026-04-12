// @vitest-environment node

import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/lib/errors";

describe("getErrorMessage", () => {
  it("returns the message from an Error instance", () => {
    const err = new Error("something broke");
    expect(getErrorMessage(err, "fallback")).toBe("something broke");
  });

  it("returns fallback for a string thrown value", () => {
    expect(getErrorMessage("oops", "fallback")).toBe("fallback");
  });

  it("returns fallback for null", () => {
    expect(getErrorMessage(null, "default")).toBe("default");
  });

  it("returns fallback for undefined", () => {
    expect(getErrorMessage(undefined, "default")).toBe("default");
  });

  it("returns fallback for a plain object", () => {
    expect(getErrorMessage({ code: 42 }, "default")).toBe("default");
  });

  it("returns fallback for a number", () => {
    expect(getErrorMessage(404, "not found")).toBe("not found");
  });

  it("returns message from subclassed Error", () => {
    class CustomError extends Error {
      constructor(msg: string) {
        super(msg);
        this.name = "CustomError";
      }
    }
    expect(getErrorMessage(new CustomError("custom"), "fallback")).toBe("custom");
  });
});
