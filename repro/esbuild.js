import * as esbuild from "esbuild";
import { wasmLoader } from "esbuild-plugin-wasm";
import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill';

esbuild.build({
  entryPoints: [
    "src/background.js",
  ],
  outdir: "build",
  define: {
    BROWSER_RUNTIME: "1",
  },
  plugins: [
    nodeModulesPolyfillPlugin({
      globals: {
        Buffer: true,
        process: true,
      },
      modules: {
        fs: true,
        buffer: true,
        process: true,
        crypto: true,
        util: true,
        os: true,
        url: true
      }
    }),
    wasmLoader({
      mode: "deferred",
    }),
  ],
  bundle: true,
  platform: "browser",
  format: "esm",
  treeShaking: true,
  logLevel: "error",
  allowOverwrite: true,
  sourcemap: true,
});
