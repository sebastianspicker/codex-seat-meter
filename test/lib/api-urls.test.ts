import { describe, expect, it } from "vitest";
import { getSeatStatusesUrl } from "@/lib/api-urls";

describe("getSeatStatusesUrl", () => {
  it("encodes seat ids safely in query string", () => {
    const url = new URL(
      getSeatStatusesUrl(["team,alpha", "a b", "slash/name"])
    );

    expect(url.pathname).toBe("/api/seats/statuses");
    expect(url.searchParams.getAll("id")).toEqual(["team,alpha", "a b", "slash/name"]);
  });
});
