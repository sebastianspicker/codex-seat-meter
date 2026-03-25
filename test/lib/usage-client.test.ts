// @vitest-environment node

import { describe, expect, it, vi, beforeAll, afterAll, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { fetchUsage } from "@/lib/usage-client";

const TEST_URL = "https://test-api.example.com/wham/usage";
const TOKEN = "test-access-token";
const ACCOUNT_ID = "acct-123";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("fetchUsage", () => {
  it("returns ok with text on a 200 response", async () => {
    server.use(
      http.get(TEST_URL, () => {
        return HttpResponse.json({ plan_type: "pro" });
      })
    );

    const result = await fetchUsage(TOKEN, ACCOUNT_ID, TEST_URL);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe(200);
      expect(JSON.parse(result.text)).toEqual({ plan_type: "pro" });
    }
  });

  it("sends Authorization header and User-Agent", async () => {
    let capturedHeaders: Record<string, string | null> = {};

    server.use(
      http.get(TEST_URL, ({ request }) => {
        capturedHeaders = {
          authorization: request.headers.get("Authorization"),
          userAgent: request.headers.get("User-Agent"),
          accept: request.headers.get("Accept"),
        };
        return HttpResponse.json({});
      })
    );

    await fetchUsage(TOKEN, undefined, TEST_URL);

    expect(capturedHeaders.authorization).toBe(`Bearer ${TOKEN}`);
    expect(capturedHeaders.userAgent).toBe("CodexSeatMeter");
    expect(capturedHeaders.accept).toBe("application/json");
  });

  it("sends ChatGPT-Account-Id header when accountId is provided", async () => {
    let accountHeader: string | null = null;

    server.use(
      http.get(TEST_URL, ({ request }) => {
        accountHeader = request.headers.get("ChatGPT-Account-Id");
        return HttpResponse.json({});
      })
    );

    await fetchUsage(TOKEN, ACCOUNT_ID, TEST_URL);
    expect(accountHeader).toBe(ACCOUNT_ID);
  });

  it("does not send ChatGPT-Account-Id when accountId is undefined", async () => {
    let accountHeader: string | null = "should-be-null";

    server.use(
      http.get(TEST_URL, ({ request }) => {
        accountHeader = request.headers.get("ChatGPT-Account-Id");
        return HttpResponse.json({});
      })
    );

    await fetchUsage(TOKEN, undefined, TEST_URL);
    expect(accountHeader).toBeNull();
  });

  it("returns error for 401 without retrying", async () => {
    let callCount = 0;

    server.use(
      http.get(TEST_URL, () => {
        callCount++;
        return HttpResponse.json({ error: "unauthorized" }, { status: 401 });
      })
    );

    const result = await fetchUsage(TOKEN, undefined, TEST_URL);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
      expect(result.error).toBe("Token expired or invalid. Re-authenticate and update the seat auth file.");
    }
    expect(callCount).toBe(1);
  });

  it("returns error for 403 without retrying", async () => {
    let callCount = 0;

    server.use(
      http.get(TEST_URL, () => {
        callCount++;
        return HttpResponse.json({ error: "forbidden" }, { status: 403 });
      })
    );

    const result = await fetchUsage(TOKEN, undefined, TEST_URL);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(403);
      expect(result.error).toBe("Token expired or invalid. Re-authenticate and update the seat auth file.");
    }
    expect(callCount).toBe(1);
  });

  it("retries on 429 and eventually returns error after max retries", async () => {
    // Speed up retries for testing
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let callCount = 0;

    server.use(
      http.get(TEST_URL, () => {
        callCount++;
        return HttpResponse.json({ error: "rate limited" }, { status: 429 });
      })
    );

    const result = await fetchUsage(TOKEN, undefined, TEST_URL);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
    }
    // Should retry: initial + 2 retries = 3 total
    expect(callCount).toBe(3);
    vi.useRealTimers();
  });

  it("retries on 502 and succeeds on second attempt", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let callCount = 0;

    server.use(
      http.get(TEST_URL, () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json({ error: "bad gateway" }, { status: 502 });
        }
        return HttpResponse.json({ plan_type: "pro" });
      })
    );

    const result = await fetchUsage(TOKEN, undefined, TEST_URL);
    expect(result.ok).toBe(true);
    expect(callCount).toBe(2);
    vi.useRealTimers();
  });

  it("retries on network errors and returns error after max retries", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let callCount = 0;

    server.use(
      http.get(TEST_URL, () => {
        callCount++;
        return HttpResponse.error();
      })
    );

    const result = await fetchUsage(TOKEN, undefined, TEST_URL);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(502);
    }
    // Should retry: initial + 2 retries = 3 total
    expect(callCount).toBe(3);
    vi.useRealTimers();
  });

  it("returns API error for non-retryable status codes", async () => {
    server.use(
      http.get(TEST_URL, () => {
        return new HttpResponse("Not Found", { status: 404 });
      })
    );

    const result = await fetchUsage(TOKEN, undefined, TEST_URL);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(404);
      expect(result.error).toContain("HTTP 404");
    }
  });
});
