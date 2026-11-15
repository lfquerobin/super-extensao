require("./sync-webpack.cjs").compile(false).then(() => {
  console.log("Worker de sincronização compilado sem ferramentas Vue 2.");
}).catch(error => { console.error(error); process.exitCode = 1; });
