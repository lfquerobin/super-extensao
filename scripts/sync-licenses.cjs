const fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "..");
function syncNotices() {
  const base = path.join(root, "sync"), packages = JSON.parse(fs.readFileSync(path.join(base, "package-lock.json"))).packages;
  const sections = ["Third-party notices for the Vue 3 synchronization interface.\nIncludes its locked production tree and the Material Design icon font.\nPackages may be tree-shaken from the delivered bundle. Floccus/MPL-2.0 is preserved separately in sync/LICENSE.txt."];
  for (const [relative, record] of Object.entries(packages).sort(([a], [b]) => a.localeCompare(b, "en"))) {
    if (!relative || record.dev && relative !== "node_modules/@mdi/font") continue;
    const folder = path.join(base, relative), pkg = JSON.parse(fs.readFileSync(path.join(folder, "package.json")));
    if (pkg.version !== record.version) throw Error("Install locked sync dependencies: " + relative);
    const names = fs.readdirSync(folder).filter(name => /^(licen[cs]e|copying|notice)(\..*)?$/i.test(name) && fs.statSync(path.join(folder, name)).isFile()).sort();
    const supplemental = pkg.name === "@vue/devtools-api" && record.version === "6.6.4"
      ? path.join(__dirname, "licenses/vue-devtools-api-6.6.4.LICENSE.txt") : null;
    if (!names.length && !supplemental) throw Error("Missing sync dependency license: " + relative);
    const text = names.length ? names.map(name => name + "\n" + fs.readFileSync(path.join(folder, name), "utf8").trim()).join("\n\n")
      : "Upstream license: https://raw.githubusercontent.com/vuejs/vue-devtools/v6.6.4/LICENSE\n" + fs.readFileSync(supplemental, "utf8").trim();
    sections.push(`${pkg.name}@${record.version}\nLicense: ${record.license || pkg.license}\nSource: ${record.resolved || pkg.homepage}\n\n` + text);
  }
  return sections.join("\n\n" + "=".repeat(72) + "\n\n").replace(/\r\n/g, "\n").replace(/[\t ]+$/gm, "") + "\n";
}
module.exports = { syncNotices };
if (require.main === module) fs.writeFileSync(path.join(root, "sync/THIRD-PARTY-NOTICES.txt"), syncNotices());
