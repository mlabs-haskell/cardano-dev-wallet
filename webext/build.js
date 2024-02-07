import * as esbuild from "esbuild";
import { wasmLoader } from "esbuild-plugin-wasm";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";
import * as fs from "node:fs";
import * as path from "node:path";
import * as sass from "sass";

let config = {
  buildDir: "build-dev",
  copy: {
    "src/popup/trampoline.html": "popup/trampoline.html",
    "src/popup/trampoline.js": "popup/trampoline.js",
    "src/popup/index.html": "popup/index.html",
    "src/popup/static": "popup/static",
    "src/public": "public",
  },
  scss: {
    "src/popup/styles.scss": "popup/styles.css",
  },
  typescript: {
    "src/popup/lib/Index.tsx": "popup/bundle",
    "src/content-script/trampoline.ts": "content-script/trampoline",
    "src/content-script/index.ts": "content-script/index",
  },
};

async function main() {
  for (let category of ["copy", "scss"]) {
    for (let key of Object.keys(config[category])) {
      let dst = config[category][key];
      dst = path.join(config.buildDir, dst);
      config[category][key] = dst;
    }
  }

  let tsEntryPoints = Object.entries(config.typescript).map(([src, dst]) => ({
    in: src,
    out: dst,
  }));
  let ctx = await watchTypescript(tsEntryPoints, config.buildDir);

  watchOthers(ctx, config);

  await serveBuildDir(ctx, config);
}

async function serveBuildDir(ctx, config) {
  let { host, port } = await ctx.serve({ servedir: config.buildDir });

  console.log(`Serving on ${host}:${port}`);
}

function watchOthers(ctx, config) {
  let dirsToWatch = {};

  let filesToWatch = [...Object.keys(config.copy), ...Object.keys(config.scss)];
  for (let file of filesToWatch) {
    let dir = path.dirname(file);
    if (dirsToWatch[dir] == null) {
      dirsToWatch[dir] = [];
    }
    dirsToWatch[dir].push(path.basename(file));
  }
  for (let file of filesToWatch) {
    if (fs.statSync(file).isDirectory()) {
      let dir = file;
      if (dirsToWatch[dir] == null) {
        dirsToWatch[dir] = [];
      }
    }
  }

  Object.entries(dirsToWatch).map(([dir, files]) => {
    fs.watch(dir, {}, (_event, filename) =>
      onFileChange(path.join(dir, filename), ctx, config),
    );
    for (let file of files) {
      onFileChange(path.join(dir, file), null, config);
    }
  });
}

async function watchTypescript(entryPoints, outdir) {
  let ctx = await esbuild.context({
    entryPoints,
    outdir,
    define: {
      BROWSER_RUNTIME: "1",
    },
    plugins: [
      nodeModulesPolyfillPlugin({
        globals: {
          Buffer: true,
        },
        modules: {
          buffer: true,
        },
      }),
      wasmLoader({
        mode: "embedded",
      }),
    ],
    bundle: true,
    platform: "browser",
    format: "esm",
    treeShaking: true,
    logLevel: "error",
    allowOverwrite: true,
    sourcemap: true,
    color: true,
    logLevel: "info",
  });
  ctx.watch();
  return ctx;
}

let DEBOUNCE_CACHE = {};
let DEBOUNCE_TIME_MS = 100;

function onFileChange(filename, ctx, config) {
  let fn = null;
  let now = new Date();
  let hh = now.getHours();
  let mm = now.getMinutes();
  let ss = now.getSeconds();
  let time =
    hh.toString().padStart(2, "0") +
    ":" +
    mm.toString().padStart(2, "0") +
    ":" +
    ss.toString().padStart(2, "0");

  if (filename in config.scss) {
    let dst = config.scss[filename];
    fn = () => {
      console.log(`[${time}] Compiling SCSS: ${filename}`);
      compileScss(filename, dst);
    };
  } else {
    while (filename != "." && filename != "/" && filename != "") {
      if (filename in config.copy) {
        let dst = config.copy[filename];
        fn = () => {
          console.log(`[${time}] Copying: ${filename}`);
          fs.cpSync(filename, dst, { force: true, recursive: true });
        };
        break;
      }
      filename = path.dirname(filename);
    }
  }

  if (fn != null) {
    if (filename in DEBOUNCE_CACHE) {
      let timer = DEBOUNCE_CACHE[filename];
      clearTimeout(timer);
    }
    let timer = setTimeout(() => {
      fn();
      if (ctx != null) {
        ctx.rebuild();
      }
    }, DEBOUNCE_TIME_MS);
    DEBOUNCE_CACHE[filename] = timer;
  }
}

function compileScss(src, dst) {
  let output = sass.compile(src, { sourceMap: true });
  let dstBaseName = path.basename(dst);
  fs.writeFileSync(
    dst,
    output.css + `\n/*# sourceMappingURL=${dstBaseName}.map */`,
  );
  fs.writeFileSync(dst + ".map", JSON.stringify(output.sourceMap));
}

await main();
