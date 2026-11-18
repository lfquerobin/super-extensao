const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createRequire } = require("node:module");

const newtab = path.resolve(__dirname, "../newtab");
const dependency = createRequire(path.join(newtab, "package.json"));
const webpack = dependency("webpack");
const MiniCssExtractPlugin = dependency("mini-css-extract-plugin");
const dotenv = dependency("dotenv");

dotenv.config({ path: path.join(newtab, ".env") });

const output = fs.mkdtempSync(path.join(os.tmpdir(), "super-newtab-"));
const config = {
  context: newtab,
  mode: "production",
  target: ["web", "es2020"],
  entry: {
    polyfills: "./src/polyfills.ts",
    main: ["normalize.css", "./src/styles.sass", "./src/main.tsx"],
  },
  output: { path: output, filename: "[name].js", publicPath: "./" },
  resolve: {
    extensions: [".js", ".ts", ".tsx"],
    modules: ["node_modules", path.join(newtab, "node_modules")],
  },
  resolveLoader: { modules: [path.join(newtab, "node_modules")] },
  module: {
    rules: [
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, "css-loader"] },
      {
        test: /\.sass$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          { loader: "sass-loader", options: { implementation: dependency("sass") } },
        ],
      },
      { test: /\.(png|jpe?g|gif)$/, type: "asset/inline" },
      { test: /\.svg$/, type: "asset/source" },
      {
        test: /\.tsx?$/,
        include: newtab,
        exclude: /node_modules/,
        loader: "ts-loader",
        options: { configFile: path.join(newtab, "tsconfig.json") },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: "[name].css" }),
    new webpack.ProvidePlugin({ browser: "webextension-polyfill" }),
    new webpack.DefinePlugin({
      GIPHY_API_KEY: JSON.stringify(process.env.GIPHY_API_KEY || ""),
      UNSPLASH_API_KEY: JSON.stringify(process.env.UNSPLASH_API_KEY || ""),
    }),
  ],
  performance: { hints: false },
};

webpack(config, (error, stats) => {
  try {
    if (error || stats.hasErrors()) throw error || new Error(stats.toString({ all: false, errors: true }));
    for (const file of ["main.js", "main.css", "polyfills.js", "main.js.LICENSE.txt"]) {
      fs.copyFileSync(path.join(output, file), path.join(newtab, file));
    }
    console.log("Nova guia compilada.");
  } catch (failure) {
    console.error(failure.message);
    process.exitCode = 1;
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
