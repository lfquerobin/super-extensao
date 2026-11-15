const path = require("node:path");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "vendor/floccus-source");
const modern = createRequire(path.join(root, "sync/package.json"));
const engine = createRequire(path.join(source, "package.json"));
const webpack = modern("webpack");
const MiniCssExtractPlugin = modern("mini-css-extract-plugin");
function config(ui) {
  const name = ui ? "options" : "background-script";
  return {
    mode: "production", devtool: false, target: ui ? ["web", "es2020"] : ["webworker", "es2020"],
    context: root,
    entry: { [name]: path.join(root, ui ? "sync/source/index.js" : "sync/engine/background-entry.js") },
    output: { path: path.join(root, "sync/js"), filename: "[name].js", publicPath: "/sync/js/", uniqueName: "superSync_" + name, globalObject: "globalThis" },
    resolve: {
      extensions: [".js", ".vue", ".ts", ".json"],
      modules: [path.join(root, "sync/node_modules"), path.join(source, "node_modules"), path.join(root, "node_modules")],
      alias: { "@sync-engine": path.join(source, "src/lib"), "vue$": modern.resolve("vue/dist/vue.runtime.esm-bundler.js") },
      fallback: { buffer: engine.resolve("buffer"), process: engine.resolve("process/browser.js"), stream: engine.resolve("stream-browserify") },
    },
    resolveLoader: { modules: [path.join(root, "sync/node_modules")] },
    module: { rules: [
      { test: /\.vue$/, loader: modern.resolve("vue-loader") },
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, modern.resolve("css-loader")] },
      { test: /\.tsx?$/, exclude: /node_modules/, use: { loader: modern.resolve("ts-loader"), options: {
        transpileOnly: true, configFile: path.join(source, "tsconfig.json"),
        compilerOptions: { rootDir: root, target: "ES2020", module: "ESNext", moduleResolution: "bundler", ignoreDeprecations: "6.0" },
      } } },
      { test: /\.(woff2?|ttf|eot|svg)$/, type: "asset/resource", generator: { filename: "[name][ext]" } },
    ] },
    plugins: [
      ...(ui ? [new (modern("vue-loader").VueLoaderPlugin)(), new MiniCssExtractPlugin({ filename: "options.css" })] : []),
      new webpack.DefinePlugin({ IS_BROWSER: "true", DEBUG: "false", BROWSERSLIST_REGEX: engine("./supportedBrowsers"),
        __VUE_OPTIONS_API__: "true", __VUE_PROD_DEVTOOLS__: "false", __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false" }),
      new webpack.ProvidePlugin({ Buffer: [engine.resolve("buffer"), "Buffer"], process: engine.resolve("process/browser.js") }),
      new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
    ],
    optimization: { splitChunks: false, runtimeChunk: false, minimize: true }, performance: { hints: false },
  };
}
function compile(ui) {
  return new Promise((resolve, reject) => webpack(config(ui), (error, stats) => {
    if (error) return reject(error);
    if (stats.hasErrors()) return reject(Error(stats.toString({ all: false, errors: true, warnings: true })));
    const modules = new Set();
    function visit(module) {
      if (module.resource) modules.add(module.resource);
      if (module.modules) for (const child of module.modules) visit(child);
    }
    for (const module of stats.compilation.modules) visit(module);
    if ([...modules].some(file => /[\\/]node_modules[\\/](?:vuetify|vuex|vue-template-compiler|@vue[\\/]compat)[\\/]/.test(file)))
      return reject(Error("Legacy UI dependency reached the sync bundle"));
    for (const file of modules) {
      const match = file.match(/^(.*[\\/]node_modules[\\/]vue)[\\/]/);
      if (match && !JSON.parse(fs.readFileSync(path.join(match[1], "package.json"))).version.startsWith("3."))
        return reject(Error("Vue 2 reached the sync bundle"));
    }
    resolve();
  }));
}
module.exports = { compile };
