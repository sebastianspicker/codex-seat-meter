// @vitest-environment node

import { describe, expect, it } from "vitest";
import { getDashboardAuthRequestInit } from "@/lib/api-auth";

describe("getDashboardAuthRequestInit", () => {
  it("returns undefined init when no secret is provided", () => {
    expect(getDashboardAuthRequestInit(null)).toBeUndefined();
    expect(getDashboardAuthRequestInit("   ")).toBeUndefined();
  });

  it("returns x-dashboard-secret header when secret is provided", () => {
    expect(getDashboardAuthRequestInit("abc123")).toEqual({
      headers: { "x-dashboard-secret": "abc123" },
    });
  });
});
