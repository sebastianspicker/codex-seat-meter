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

  it("returns path with trailing slash preserved", () => {
    process.env.SEATS_DIRECTORY = "/tmp/seats/";
    // getSeatsDirectory returns the trimmed value as-is; trailing slash is not stripped
    expect(getSeatsDirectory()).toBe("/tmp/seats/");
  });

  it("returns path without trailing slash unchanged", () => {
    process.env.SEATS_DIRECTORY = "/tmp/seats";
    expect(getSeatsDirectory()).toBe("/tmp/seats");
  });

  it("throws when SEATS_DIRECTORY is not set", () => {
    delete process.env.SEATS_DIRECTORY;
    expect(() => getSeatsDirectory()).toThrow("is not set");
  });

  it("throws when SEATS_DIRECTORY is empty or whitespace", () => {
    process.env.SEATS_DIRECTORY = "   ";
    expect(() => getSeatsDirectory()).toThrow("is not set");
  });
});

describe("getCodexUsageUrl edge cases", () => {
  it("strips trailing slash from base URL", () => {
    process.env.CODEX_USAGE_BASE_URL = "https://example.com/api/";
    process.env.CODEX_USAGE_PATH = "usage";
    expect(getCodexUsageUrl()).toBe("https://example.com/api/usage");
  });

  it("strips leading slash from path", () => {
    process.env.CODEX_USAGE_BASE_URL = "https://example.com/api";
    process.env.CODEX_USAGE_PATH = "/usage";
    expect(getCodexUsageUrl()).toBe("https://example.com/api/usage");
  });

  it("handles both trailing and leading slashes", () => {
    process.env.CODEX_USAGE_BASE_URL = "https://example.com/api/";
    process.env.CODEX_USAGE_PATH = "/usage";
    expect(getCodexUsageUrl()).toBe("https://example.com/api/usage");
  });
});
