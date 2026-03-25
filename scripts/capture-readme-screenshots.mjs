#!/usr/bin/env node

import { spawn } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

const HOST = "127.0.0.1";
const PORT = 3200;
const BASE_URL = `http://${HOST}:${PORT}`;
const START_TIMEOUT_MS = 120_000;
const READY_POLL_MS = 500;

const SCREENSHOT_NAMES = [
  "dashboard-overview-desktop.png",
  "toolbar-controls-desktop.png",
  "seat-card-focus-desktop.png",
  "dashboard-overview-mobile.png",
];

const DASHBOARD_PREFERENCES = {
  autoRefresh: false,
  intervalMs: 60000,
  sort: "id",
  filter: "all",
  query: "",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(REPO_ROOT, "docs", "screenshots");

function log(message) {
  console.log(`[screenshots] ${message}`);
}

function sleep(ms) {
  return delay(ms);
}

async function safeUnlink(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (!(err && typeof err === "object" && "code" in err && err.code === "ENOENT")) {
      throw err;
    }
  }
}

async function stopDevServer(devServer) {
  if (!devServer) return;
  if (devServer.exitCode !== null || devServer.killed) return;

  devServer.kill("SIGTERM");
  const settled = await Promise.race([
    once(devServer, "exit").then(() => true),
    sleep(10_000).then(() => false),
  ]);

  if (!settled) {
    devServer.kill("SIGKILL");
    await once(devServer, "exit").catch(() => undefined);
  }
}

async function waitForServerReady() {
  const deadline = Date.now() + START_TIMEOUT_MS;
  let lastErrorMessage = "";

  while (Date.now() < deadline) {
    try {
      const [rootResp, seatsResp] = await Promise.all([
        fetch(BASE_URL),
        fetch(`${BASE_URL}/api/seats`),
      ]);

      if (rootResp.ok && seatsResp.ok) {
        const seatsPayload = await seatsResp.json();
        if (Array.isArray(seatsPayload) && seatsPayload.length > 0) {
          return;
        }
      }
    } catch (err) {
      lastErrorMessage = err instanceof Error ? err.message : String(err);
    }

    await sleep(READY_POLL_MS);
  }

  throw new Error(
    `Timed out waiting for ${BASE_URL}. ${lastErrorMessage ? `Last error: ${lastErrorMessage}` : ""}`.trim()
  );
}

function spawnDevServer() {
  const env = {
    ...process.env,
    DEMO_MODE: "1",
    SEATS_DIRECTORY: "",
    NEXT_TELEMETRY_DISABLED: "1",
  };

  const devServer = spawn(
    "npm",
    ["run", "dev", "--", "--hostname", HOST, "--port", String(PORT)],
    {
      cwd: REPO_ROOT,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  const output = [];
  const appendOutput = (source, chunk) => {
    const text = chunk.toString();
    output.push(`[${source}] ${text}`);
    if (output.length > 200) {
      output.splice(0, output.length - 200);
    }
  };

  devServer.stdout?.on("data", (chunk) => appendOutput("stdout", chunk));
  devServer.stderr?.on("data", (chunk) => appendOutput("stderr", chunk));

  return {
    devServer,
    getOutput: () => output.join(""),
  };
}

async function applyDeterministicPageSetup(page) {
  await page.addInitScript((preferences, styleText) => {
    localStorage.setItem("codex-seat-meter.preferences", JSON.stringify(preferences));
    const inject = () => {
      const style = document.createElement("style");
      style.setAttribute("data-readme-screenshot", "1");
      style.textContent = styleText;
      document.head.appendChild(style);
    };
    if (document.head) {
      inject();
    } else {
      document.addEventListener("DOMContentLoaded", inject, { once: true });
    }
  }, DASHBOARD_PREFERENCES, `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
    * {
      caret-color: transparent !important;
    }
  `);
}

async function waitForDashboardReady(page) {
  await page.waitForSelector('h1:has-text("Codex Seat Meter")', { timeout: 45_000 });

  await page.waitForFunction(() => {
    const body = document.body?.textContent ?? "";
    const hasLoadingText = body.includes("Establishing connection") || body.includes("Loading dashboard");
    const cards = document.querySelectorAll('section[aria-label^="Seat "]');
    return cards.length > 0 && !hasLoadingText;
  }, { timeout: 45_000 });

  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
}

async function preparePage(page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await applyDeterministicPageSetup(page);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 45_000 });
  await waitForDashboardReady(page);
}

async function captureDesktopShots(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  await preparePage(page);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "dashboard-overview-desktop.png"),
    fullPage: false,
  });

  await page.getByLabel("Search seats by id").fill("team");
  await page.getByLabel("Filter seats").selectOption("healthy");
  await page.getByLabel("Sort seats").selectOption("highest-credits");
  await page.waitForTimeout(300);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "toolbar-controls-desktop.png"),
    fullPage: false,
  });

  await page.getByLabel("Search seats by id").fill("");
  await page.getByLabel("Filter seats").selectOption("all");
  await page.getByLabel("Sort seats").selectOption("id");

  const firstSeatCard = page.locator('section[aria-label^="Seat "]').first();
  await firstSeatCard.scrollIntoViewIfNeeded();
  await firstSeatCard.evaluate((node) => {
    node.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await page.waitForTimeout(300);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "seat-card-focus-desktop.png"),
    fullPage: false,
  });

  await context.close();
}

async function captureMobileShot(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  await preparePage(page);

  await page.screenshot({
    path: path.join(OUTPUT_DIR, "dashboard-overview-mobile.png"),
    fullPage: false,
  });

  await context.close();
}

async function ensureOutputFolder() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await Promise.all(
    SCREENSHOT_NAMES.map((fileName) => safeUnlink(path.join(OUTPUT_DIR, fileName)))
  );
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Executable doesn't exist")) {
      throw new Error(`${message}\nInstall the browser once with: npx playwright install chromium`);
    }
    throw err;
  }
}

async function main() {
  let devServer = null;
  let browser = null;

  try {
    await ensureOutputFolder();

    const spawned = spawnDevServer();
    devServer = spawned.devServer;

    log(`Starting demo server on ${BASE_URL}`);
    await waitForServerReady();
    log("Server is ready");

    browser = await launchBrowser();
    log("Capturing desktop screenshots");
    await captureDesktopShots(browser);

    log("Capturing mobile screenshot");
    await captureMobileShot(browser);
    log(`Saved screenshots in ${path.relative(REPO_ROOT, OUTPUT_DIR)}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[screenshots] Capture failed: ${message}`);
    throw err;
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
    await stopDevServer(devServer).catch(() => undefined);
  }
}

main().catch(() => {
  process.exitCode = 1;
});
