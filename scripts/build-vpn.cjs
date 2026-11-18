const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");
const { wrapModule } = require("./module-bundle.cjs");
const { vpnNotices } = require("./vpn-licenses.cjs");

const root = path.resolve(__dirname, "..");
const vpn = path.join(root, "vpn");
const dependency = createRequire(path.join(vpn, "package.json"));
const webpack = dependency("webpack");
const TerserPlugin = dependency("terser-webpack-plugin");
const output = fs.mkdtempSync(path.join(os.tmpdir(), "super-vpn-"));
const config = {
  mode: "production",
  context: vpn,
  target: ["web", "es5"],
  devtool: false,
  entry: {
    background: "./runtime/worker.ts",
    transmit: "./runtime/transmit.ts",
  },
  output: { path: output, filename: "[name].js" },
  resolve: { extensions: [".ts", ".js"] },
  module: {
    rules: [
      {
        test: /\.ts$/,
        include: path.join(vpn, "runtime"),
        enforce: "pre",
        loader: path.join(__dirname, "vpn-context-loader.cjs"),
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: dependency.resolve("ts-loader"),
        options: {
          configFile: path.join(vpn, "tsconfig.json"),
          compilerOptions: { noEmit: false },
        },
      },
    ],
  },
  optimization: {
    splitChunks: false,
    runtimeChunk: false,
    minimizer: [new TerserPlugin({ terserOptions: { format: { comments: false } } })],
  },
  performance: { hints: false },
};

webpack(config, (error, stats) => {
  try {
    if (error || stats.hasErrors()) {
      throw error || new Error(stats.toString({ all: false, errors: true }));
    }

    const notices = vpnNotices();
    const assets = [
      [path.join(output, "background.js"), "background.js"],
      [path.join(output, "transmit.js"), "transmit.js"],
    ];
    const polyfill = fs.readFileSync(dependency.resolve("webextension-polyfill/dist/browser-polyfill.min.js"), "utf8");
    const releasePolyfill = polyfill.replace(/^\/\/# sourceMappingURL=.*\r?\n/gm, "");
    wrapModule(assets[0][0], "vpn");
    for (const [file, name] of assets) {
      fs.copyFileSync(file, path.join(vpn, "js", name));
    }
    fs.writeFileSync(path.join(vpn, "js/browser-polyfill.min.js"), releasePolyfill);
    fs.writeFileSync(path.join(vpn, "THIRD-PARTY-NOTICES.txt"), notices);
    const integration = fs.readFileSync(path.join(root, "docs/proton-vpn.md"), "utf8");
    fs.writeFileSync(path.join(vpn, "INTEGRACAO.md"), integration.replace(
      /\((vpn-(?:interface|engine|dependencias)\.md)(?=[)#])/g,
      "(../docs/$1",
    ));
    console.log("Worker e relay da VPN compilados.");
  } catch (failure) {
    console.error(failure.message);
    process.exitCode = 1;
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
