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
});
