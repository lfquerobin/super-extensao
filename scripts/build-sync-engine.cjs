require("./sync-webpack.cjs").compile(false).then(() => {
  require('./module-bundle.cjs').wrapModule(require('node:path').resolve(__dirname, '../sync/js/background-script.js'), 'sync');
  console.log("Worker de sincronização compilado sem ferramentas Vue 2.");
}).catch(error => { console.error(error); process.exitCode = 1; });
