const path = require("path");
const webpackConfigGhPages = require("./webpack.config.gh-pages");

module.exports = {
  ...webpackConfigGhPages,
  watch: true,
  devtool: "inline-source-map",
  devServer: {
    static: path.join(__dirname, "dist"),
    compress: true,
    port: 9000,
  },
  mode: "development",
  output: {
    filename: "glify-browser.js",
    path: path.resolve(__dirname, ".dev-server"),
    libraryTarget: "umd",
  },
};
