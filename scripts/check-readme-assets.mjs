#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const README_PATH = path.join(REPO_ROOT, "README.md");
const EXPECTED_SCREENSHOTS = [
  "docs/screenshots/dashboard-overview-desktop.png",
  "docs/screenshots/toolbar-controls-desktop.png",
  "docs/screenshots/seat-card-focus-desktop.png",
  "docs/screenshots/dashboard-overview-mobile.png",
];

function extractReadmeImagePaths(content) {
  const regex = /!\[[^\]]*]\(([^)]+)\)/g;
  const paths = [];
  let match = regex.exec(content);
  while (match) {
    let value = match[1].trim();
    if (value.startsWith("<") && value.endsWith(">")) {
      value = value.slice(1, -1);
    }
    const normalized = value.split(/\s+/)[0];
    if (!normalized || /^https?:\/\//i.test(normalized)) {
      match = regex.exec(content);
      continue;
    }
    paths.push(normalized);
    match = regex.exec(content);
  }
  return paths;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  const readme = fs.readFileSync(README_PATH, "utf8");
  const imagePaths = extractReadmeImagePaths(readme);
  const screenshotPaths = imagePaths.filter((imagePath) => imagePath.startsWith("docs/screenshots/"));

  for (const expectedPath of EXPECTED_SCREENSHOTS) {
    assert(
      screenshotPaths.includes(expectedPath),
      `README is missing screenshot link: ${expectedPath}`
    );
  }

  for (const linkedPath of screenshotPaths) {
    const absolutePath = path.join(REPO_ROOT, linkedPath);
    assert(fs.existsSync(absolutePath), `Missing screenshot asset referenced in README: ${linkedPath}`);
  }

  console.log(
    `[readme-assets] OK: ${screenshotPaths.length} screenshot link(s) in README map to files on disk.`
  );
}

try {
  main();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[readme-assets] ${message}`);
  process.exitCode = 1;
}
