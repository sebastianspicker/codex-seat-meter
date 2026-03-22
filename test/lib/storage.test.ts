import { describe, expect, it, vi } from "vitest";
import { safeReadLocalStorage, safeWriteLocalStorage } from "@/lib/storage";

describe("safeReadLocalStorage", () => {
  it("returns null when key is missing", () => {
    expect(safeReadLocalStorage("missing")).toBeNull();
  });

  it("returns null if localStorage throws", () => {
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    expect(safeReadLocalStorage("k")).toBeNull();
    getItemSpy.mockRestore();
  });

  it("returns null when localStorage throws SecurityError (e.g. cross-origin iframe)", () => {
    const securityError = new DOMException(
      "The operation is insecure.",
      "SecurityError"
    );
    const getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw securityError;
      });

    expect(safeReadLocalStorage("k")).toBeNull();
    getItemSpy.mockRestore();
  });
});

describe("safeWriteLocalStorage", () => {
  it("returns false if localStorage throws", () => {
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    expect(safeWriteLocalStorage("k", "v")).toBe(false);
    setItemSpy.mockRestore();
  });

  it("returns false when localStorage throws QuotaExceededError", () => {
    const quotaError = new DOMException(
      "Failed to execute 'setItem' on 'Storage': Setting the value exceeded the quota.",
      "QuotaExceededError"
    );
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw quotaError;
      });

    expect(safeWriteLocalStorage("key", "x".repeat(10000))).toBe(false);
    setItemSpy.mockRestore();
  });

  it("returns false when localStorage throws SecurityError", () => {
    const securityError = new DOMException(
      "The operation is insecure.",
      "SecurityError"
    );
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw securityError;
      });

    expect(safeWriteLocalStorage("k", "v")).toBe(false);
    setItemSpy.mockRestore();
  });
});
