const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { JSDOM } = require("jsdom");

function checkIntegrity(root = path.resolve(__dirname, "..")) {
  const errors = [], visited = new Set();
  const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  const manifest = readJson("manifest.json"), pkg = readJson("package.json"), lock = readJson("package-lock.json");
  if (!/^\d+\.\d+\.\d+$/.test(manifest.version) ||
      [pkg.version, lock.version, lock.packages?.[""]?.version].some(version => version !== manifest.version))
    errors.push("Version mismatch: manifest, package and lockfile must agree");
  const visit = (reference, from = "manifest.json", base = from) => {
    if (!reference || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)) return;
    let local;
    try { local = decodeURIComponent(reference.split(/[?#]/, 1)[0]); }
    catch { errors.push(`${from}: invalid asset URL ${reference}`); return; }
    const target = path.resolve(root, local.startsWith("/") ? "." : path.dirname(base), local.replace(/^\//, ""));
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      errors.push(`${from}: asset outside extension: ${reference}`); return;
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      errors.push(`${from}: missing asset ${reference}`); return;
    }
    if (visited.has(relative)) return;
    visited.add(relative);
    const ext = path.extname(target);
    if (![".html", ".css", ".js"].includes(ext)) return;
    const source = fs.readFileSync(target, "utf8");
    if (ext === ".html") {
      const dom = new JSDOM(source);
      for (const el of dom.window.document.querySelectorAll("script[src],link[href],img[src],source[src],iframe[src]"))
        visit(el.getAttribute("src") || el.getAttribute("href"), relative);
      dom.window.close();
    } else if (ext === ".css") {
      const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
      for (const match of css.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)|@import\s+["']([^"']+)["']/g))
        visit(match[1] || match[2], relative);
    } else {
      try { new vm.Script(source, { filename: relative }); }
      catch (error) { errors.push(`${relative}: ${error.message}`); }
      for (const match of source.matchAll(/\bimportScripts\(\s*((?:"[^"]*"|'[^']*')(?:\s*,\s*(?:"[^"]*"|'[^']*'))*)\s*\)/g))
        for (const item of match[1].matchAll(/["']([^"']+)["']/g)) visit(item[1], relative);
      for (const match of source.matchAll(/\b(?:chrome|browser)\.runtime\.getURL\(["']([^"']+)["']\)/g))
        visit(match[1], relative, "manifest.json");
    }
  };
  const refs = [manifest.background?.service_worker, manifest.action?.default_popup, manifest.options_page,
    "sync/html/options.html", "sync/js/options.js", "vpn/interface.js",
    ...Object.values(manifest.icons || {}), ...Object.values(manifest.action?.default_icon || {}),
    ...Object.values(manifest.chrome_url_overrides || {}), manifest.storage?.managed_schema,
    ...(manifest.content_scripts || []).flatMap(entry => [...(entry.js || []), ...(entry.css || [])]),
    ...(manifest.web_accessible_resources || []).flatMap(entry => entry.resources || [])];
  for (const ref of refs) visit(ref);
  if (manifest.default_locale) {
    const messages = readJson(`_locales/${manifest.default_locale}/messages.json`);
    for (const value of [manifest.name, manifest.description, manifest.action?.default_title])
      for (const match of (value || "").matchAll(/__MSG_(.+?)__/g))
        if (!messages[match[1]]) errors.push(`Missing manifest translation: ${match[1]}`);
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return { version: manifest.version, files: visited.size };
}
if (require.main === module) {
  try { console.log(JSON.stringify({ integrity: true, ...checkIntegrity() })); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { checkIntegrity };
