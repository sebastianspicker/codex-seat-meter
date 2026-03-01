// @vitest-environment node

import { afterEach, describe, expect, it } from "vitest";
import { getCodexUsageUrl, getSeatsDirectory } from "@/lib/config";

const originalEnv = {
  CODEX_USAGE_BASE_URL: process.env.CODEX_USAGE_BASE_URL,
  CODEX_USAGE_PATH: process.env.CODEX_USAGE_PATH,
  SEATS_DIRECTORY: process.env.SEATS_DIRECTORY,
};

afterEach(() => {
  process.env.CODEX_USAGE_BASE_URL = originalEnv.CODEX_USAGE_BASE_URL;
  process.env.CODEX_USAGE_PATH = originalEnv.CODEX_USAGE_PATH;
  process.env.SEATS_DIRECTORY = originalEnv.SEATS_DIRECTORY;
});

describe("getCodexUsageUrl", () => {
  it("returns the default URL when env is not set", () => {
    delete process.env.CODEX_USAGE_BASE_URL;
    delete process.env.CODEX_USAGE_PATH;

    expect(getCodexUsageUrl()).toBe("https://chatgpt.com/backend-api/wham/usage");
  });

  it("accepts http and https schemes", () => {
    process.env.CODEX_USAGE_BASE_URL = "http://localhost:1234/base";
    process.env.CODEX_USAGE_PATH = "/usage";

    expect(getCodexUsageUrl()).toBe("http://localhost:1234/base/usage");
  });

  it("rejects non-http schemes", () => {
    process.env.CODEX_USAGE_BASE_URL = "file:///tmp";
    process.env.CODEX_USAGE_PATH = "usage";

    expect(() => getCodexUsageUrl()).toThrow("must be http(s)");
  });
});

describe("getSeatsDirectory", () => {
  it("requires an absolute directory path", () => {
    process.env.SEATS_DIRECTORY = "relative/path";
    expect(() => getSeatsDirectory()).toThrow("must be an absolute path");
  });
});
