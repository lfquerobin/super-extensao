// Full installed extension, empty temporary profile, no external services/accounts.
const fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "super-extension-integrity-"));
const extension = path.join(temp, "extension");
fs.mkdirSync(extension);
for (const name of fs.readdirSync(root)) {
  if (["icons", "_locales", "ui", "newtab", "sync", "vpn"].includes(name) ||
      /\.(?:js|css|html)$/.test(name) || name === "manifest.json")
    fs.cpSync(path.join(root, name), path.join(extension, name), {
      recursive: true, filter: source => !source.split(path.sep).includes("node_modules"),
    });
}
let context;
async function main() {
  const errors = [];
  context = await chromium.launchPersistentContext(path.join(temp, "profile"), {
    executablePath: process.env.CHROMIUM_PATH, headless: true,
    ignoreDefaultArgs: ["--disable-extensions"],
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
  });
  context.on("weberror", error => errors.push(error.error().message));
  await context.route(/^https?:\/\//, route => route.abort());
  const worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");
  const origin = worker.url().replace(/\/background\.js$/, "");
  assert.match(origin, /^chrome-extension:\/\/[a-z]+$/);
  await worker.evaluate(() => SuperModuleHost.ready);
  const state = await worker.evaluate(async () => ({
    version: chrome.runtime.getManifest().version,
    preferences: typeof SuperPreferences?.locale?.get === "function",
    routing: typeof SuperVpnRouting?.usesVpn === "function",
    diagnostics: typeof getVpnDiagnostics === "function",
    proxy: await chrome.proxy.settings.get({ incognito: false }),
  }));
  assert.equal(state.version, require("../manifest.json").version);
  assert.ok(state.preferences && state.routing && state.diagnostics);
  assert.notEqual(state.proxy.levelOfControl, "controlled_by_this_extension", "logged-out startup must not set a proxy");
  const page = await context.newPage();
  await page.goto(origin + "/popup.html");
  await page.locator("#clearNow").waitFor();
  await page.locator('[data-tab="sync"]').click();
  await page.waitForFunction(() => Boolean(window.superSyncApp));
  await page.evaluate(async () => { await window.superSyncApp.$router.push("/new"); });
  await page.locator(".sync-service").first().waitFor();
  assert.equal(await page.locator(".sync-service").count(), 2);
  await page.locator('[data-tab="vpn"]').click();
  await page.waitForFunction(() => Boolean(window.SuperVpnReady));
  await page.evaluate(() => window.SuperVpnReady);
  assert.equal(await page.locator("#vpnPanelStatus").isVisible(), false);
  await page.goto(origin + "/newtab/index.html");
  await page.locator(".Dashboard").waitFor();
  await page.evaluate(() => chrome.storage.sync.set({
    "tabliss/config/timeZone": "Invalid/Zone",
    "tabliss/config/data/default-time": { timeZone: "Invalid/Zone", mode: "digital", hour12: false, showMinutes: true, showSeconds: true },
  }));
  await page.reload();
  await page.locator(".Time").first().waitFor();
  assert.doesNotMatch(await page.locator(".Time").first().innerText(), /Invalid|NaN/);
  await page.keyboard.press("s");
  await page.locator(".Settings").waitFor();
  await page.close();
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ nativeIntegrity: true, version: state.version,
    browser: context.browser()?.version(), checks: ["full-worker", "cleanup-panel", "sync-two-providers", "vpn-panel", "logged-out-proxy", "newtab-editor", "corrupt-timezone-recovery", "no-page-errors"] }));
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await context?.close();
  if (path.dirname(temp) === path.resolve(os.tmpdir()) && path.basename(temp).startsWith("super-extension-integrity-"))
    fs.rmSync(temp, { recursive: true, force: true });
});
