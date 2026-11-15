const fs = require("node:fs"), path = require("node:path");
const root = path.resolve(__dirname, "..");
require("./sync-webpack.cjs").compile(true).then(() => {
  fs.copyFileSync(path.join(root, "sync/source/interface.css"), path.join(root, "sync/theme.css"));
  const stylesheet = path.join(root, "sync/js/options.css");
  fs.writeFileSync(stylesheet, fs.readFileSync(stylesheet, "utf8").trimEnd() + "\n");
  fs.writeFileSync(path.join(root, "sync/THIRD-PARTY-NOTICES.txt"), require("./sync-licenses.cjs").syncNotices());
  console.log("Interface Vue 3 de sincronização compilada, sem Vuetify/Vuex.");
}).catch(error => { console.error(error); process.exitCode = 1; });
