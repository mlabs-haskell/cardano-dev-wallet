import webpack from "webpack";
import path from "node:path";
import NodePolyfillPlugin from "node-polyfill-webpack-plugin";
import CopyPlugin from 'copy-webpack-plugin';

import * as url from 'url';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));



/**
 * @type {webpack.Configuration}
 */
const config = {
  mode: "development",
  entry: {
    "background/background": "./src/background/background.js",
    "popup/popup": "./src/popup/popup.js",
    "content-script/index": "./src/content-script/index.js",
  },
  devtool: "source-map",
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].js',
    clean: true,
    module: true,
  },
  plugins: [
    new NodePolyfillPlugin(),
    new webpack.DefinePlugin({
      BROWSER_RUNTIME: '1'
    }),
    new CopyPlugin({
      patterns: [
        {
          context: "src",
          from: "**/*",
          globOptions: {
            ignore: ["**/*.js"],
          }
        }
      ]
    }),
  ],
  resolve: {
    fallback: {
      fs: false,
      util: false,
      net: false,
      tls: false,
    },
    symlinks: false,
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
    outputModule: true,
  },
};

export default config;
