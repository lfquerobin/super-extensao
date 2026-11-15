const { test } = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const { checkIntegrity } = require("../scripts/check-integrity.cjs");
test("installed extension has consistent versions, parseable scripts and all static assets", () => {
  assert.ok(checkIntegrity().files > 50);
});
test("integrity audit detects missing assets, invalid scripts, version drift and paths outside the extension", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "super-integrity-fixture-"));
  const put = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), typeof value === "string" ? value : JSON.stringify(value));
  };
  try {
    put("manifest.json", { version: "1.0.0", background: { service_worker: "worker.js" } });
    put("package.json", { version: "1.0.0" });
    put("package-lock.json", { version: "1.0.0", packages: { "": { version: "1.0.0" } } });
    put("worker.js", "importScripts('/nested.js');"); put("nested.js", "void 0;");
    put("sync/html/options.html", '<link rel="stylesheet" href="../style.css">');
    put("sync/style.css", 'body {background:url("../icon.png")}'); put("icon.png", "image");
    put("sync/js/options.js", "void 0;"); put("vpn/interface.js", "void 0;");
    for (const file of ['newtab/main.js','newtab/polyfills.js','newtab/integration.js','newtab/main.css','newtab/integration.css','autoplay-main.js','autoplay-bridge.js','vpn-auth-bridge.js','vpn/js/transmit.js']) put(file,file.endsWith('.css') ? 'body{}' : 'void 0;');
    assert.doesNotThrow(() => checkIntegrity(root));
    put("worker.js", 'importScripts("missing.js");'); assert.throws(() => checkIntegrity(root), /missing asset missing.js/);
    put("worker.js", 'let = ;'); assert.throws(() => checkIntegrity(root), /worker.js/);
    put("worker.js", 'importScripts("../outside.js");'); assert.throws(() => checkIntegrity(root), /outside extension/);
    put("worker.js", "void 0;"); put("package.json", { version: "1.0.1" });
    assert.throws(() => checkIntegrity(root), /Version mismatch/);
  } finally {
    if (path.dirname(root) === path.resolve(os.tmpdir()) && path.basename(root).startsWith("super-integrity-fixture-"))
      fs.rmSync(root, { recursive: true, force: true });
  }
});
