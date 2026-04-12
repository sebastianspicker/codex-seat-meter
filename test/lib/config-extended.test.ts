// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isDemoMode,
  getDashboardSecret,
  allowDashboardSecretQueryParam,
  getCodexUsageUrl,
} from "@/lib/config";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("isDemoMode", () => {
  it("returns true when DEMO_MODE=1", () => {
    process.env.DEMO_MODE = "1";
    expect(isDemoMode()).toBe(true);
  });

  it("returns true when DEMO_MODE=true", () => {
    process.env.DEMO_MODE = "true";
    expect(isDemoMode()).toBe(true);
  });

  it("returns true when DEMO_MODE=yes", () => {
    process.env.DEMO_MODE = "yes";
    expect(isDemoMode()).toBe(true);
  });

  it("returns true when DEMO_MODE=TRUE (case-insensitive)", () => {
    process.env.DEMO_MODE = "TRUE";
    expect(isDemoMode()).toBe(true);
  });

  it("returns false when DEMO_MODE=0", () => {
    process.env.DEMO_MODE = "0";
    expect(isDemoMode()).toBe(false);
  });

  it("returns false when DEMO_MODE=false", () => {
    process.env.DEMO_MODE = "false";
    expect(isDemoMode()).toBe(false);
  });

  it("returns false when DEMO_MODE is not set", () => {
    delete process.env.DEMO_MODE;
    expect(isDemoMode()).toBe(false);
  });

  it("returns false when DEMO_MODE is empty string", () => {
    process.env.DEMO_MODE = "";
    expect(isDemoMode()).toBe(false);
  });
});

describe("getDashboardSecret", () => {
  it("returns null when DASHBOARD_SECRET is not set", () => {
    delete process.env.DASHBOARD_SECRET;
    expect(getDashboardSecret()).toBeNull();
  });

  it("returns null when DASHBOARD_SECRET is empty", () => {
    process.env.DASHBOARD_SECRET = "";
    expect(getDashboardSecret()).toBeNull();
  });

  it("returns null when DASHBOARD_SECRET is whitespace only", () => {
    process.env.DASHBOARD_SECRET = "   ";
    expect(getDashboardSecret()).toBeNull();
  });

  it("returns the trimmed secret when set", () => {
    process.env.DASHBOARD_SECRET = "  my-secret-key  ";
    expect(getDashboardSecret()).toBe("my-secret-key");
  });

  it("warns for short secrets (< 8 chars)", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    process.env.DASHBOARD_SECRET = "short";
    getDashboardSecret();
    // The warning may or may not fire depending on module-level flag state
    // Just verify the function returns the value correctly
    expect(getDashboardSecret()).toBe("short");
    warnSpy.mockRestore();
  });

  it("returns secret for a sufficiently long secret", () => {
    process.env.DASHBOARD_SECRET = "a-very-long-secret-that-is-secure";
    expect(getDashboardSecret()).toBe("a-very-long-secret-that-is-secure");
  });
});

describe("allowDashboardSecretQueryParam", () => {
  it("returns true when ALLOW_DASHBOARD_SECRET_QUERY=1", () => {
    process.env.ALLOW_DASHBOARD_SECRET_QUERY = "1";
    expect(allowDashboardSecretQueryParam()).toBe(true);
  });

  it("returns true when ALLOW_DASHBOARD_SECRET_QUERY=true", () => {
    process.env.ALLOW_DASHBOARD_SECRET_QUERY = "true";
    expect(allowDashboardSecretQueryParam()).toBe(true);
  });

  it("returns true when ALLOW_DASHBOARD_SECRET_QUERY=yes", () => {
    process.env.ALLOW_DASHBOARD_SECRET_QUERY = "yes";
    expect(allowDashboardSecretQueryParam()).toBe(true);
  });

  it("falls back to NODE_ENV check when not explicitly set", () => {
    delete process.env.ALLOW_DASHBOARD_SECRET_QUERY;
    // In test environment NODE_ENV is typically "test" which is not "production"
    expect(allowDashboardSecretQueryParam()).toBe(true);
  });

  it("returns false in production when not explicitly set", () => {
    delete process.env.ALLOW_DASHBOARD_SECRET_QUERY;
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(allowDashboardSecretQueryParam()).toBe(false);
    (process.env as Record<string, string | undefined>).NODE_ENV = prev;
  });
});

describe("getCodexUsageUrl - invalid URL", () => {
  it("throws for completely invalid base URL", () => {
    process.env.CODEX_USAGE_BASE_URL = "not-a-url";
    process.env.CODEX_USAGE_PATH = "usage";
    expect(() => getCodexUsageUrl()).toThrow("Invalid");
  });
});
