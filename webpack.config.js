const path = require("path");
const webpack = require("webpack");

const web = {
  target: "web",
  entry: "./src/index.ts",
  devtool: "source-map",
  devServer: {
    static: path.join(__dirname, "dist"),
    compress: true,
    port: 9000,
  },
  mode: "production",
  plugins: [
    new webpack.ProvidePlugin({
      leaflet: "leaflet",
    }),
  ],
  externals: {
    leaflet: {
      commonjs: "leaflet",
      commonjs2: "leaflet",
      amd: "leaflet",
      root: "L", // indicates global variable
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        exclude: /node_modules/,
        use: ["ts-shader-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "glify-browser.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "umd",
  },
};

const node = {
  ...web,
  target: "node",
  output: {
    filename: "glify.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "umd",
  },
};

module.exports = [web, node];
