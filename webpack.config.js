const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const path = require("path");

module.exports = {
  // externals: [nodeExternals()],
  externals: {
    bufferutil: "commonjs bufferutil",
    "utf-8-validate": "commonjs utf-8-validate"
  },
  entry: {
    accounts: "./services/accounts/index.js",
    inventory: "./services/inventory/index.js",
    products: "./services/products/index.js",
    reviews: "./services/reviews/index.js",
    gateway: "./services/gateway/index.js"
  },
  optimization: {
    minimize: true
  },
  target: "node",
  performance: {
    maxEntrypointSize: 2540000,
    maxAssetSize: 2540000
  },
  module: {},
  output: {
    filename: "[name]/index.js",
    sourceMapFilename: "[name]/[filebase].map",
    libraryTarget: "commonjs2",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [new CleanWebpackPlugin()]
};
