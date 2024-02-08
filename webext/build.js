import * as esbuild from "esbuild";
import { wasmLoader } from "esbuild-plugin-wasm";
import { nodeModulesPolyfillPlugin } from "esbuild-plugins-node-modules-polyfill";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import * as sass from "sass";

import config from "./build.config.js";

function printUsage() {
  console.log();
  console.log("build.js [options]");
  console.log();
  console.log("Options:");
  console.log();
  console.log("  --release");
  console.log(
    "    Build in release mode. If not specified, build in dev mode.",
  );
  console.log(
    "    In release mode, dev server is not started and watching is not enabled.",
  );
  console.log();
  console.log("  --browser chrome|firefox");
  console.log("    Set browser. Used to generate manifest.json.");
  console.log();
  console.log("  --help");
  console.log("    Show usage.");
}

async function main() {
  let args = process.argv.slice(2);

  let argsConfig = {
    release: false,
    browser: "chrome",
  };

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    if (arg == "--release") {
      argsConfig.release = true;
    } else if (arg == "--browser") {
      let browser = args[i + 1];
      i += 1;
      if (browser != "chrome" && browser != "firefox") {
        console.log("Invalid value for browser:", browser);
        printUsage();
        process.exit(-1);
      }
      argsConfig.browser = browser;
    } else if (arg == "--help") {
      printUsage();
      process.exit(0);
    } else {
      console.log("Unknown argument:", arg);
      printUsage();
      process.exit(-1);
    }
  }

  fs.rmSync(config.buildDir, { recursive: true, force: true });
  fs.mkdirSync(config.buildDir);

  for (let category of ["copy", "scss", "manifest"]) {
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

  watchOthers({ config, watch: !argsConfig.release, argsConfig });

  let ctx = await watchTypescript({
    entryPoints: tsEntryPoints,
    outdir: config.buildDir,
    watch: !argsConfig.release,
  });

  if (!argsConfig.release) {
    await serveBuildDir(ctx, config);
  }
}

async function serveBuildDir(ctx, config) {
  let { host, port } = await ctx.serve({ servedir: config.buildDir });

  log(`Serving on ${host}:${port}`);
}

function watchOthers({ config, watch, argsConfig }) {
  // All files in config.copy and config.scss
  let filesToWatch = [
    ...Object.keys(config.copy),
    ...Object.keys(config.scss),
    ...Object.keys(config.manifest),
  ];

  let dirsToWatch = {};

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
    if (watch) {
      fs.watch(dir, {}, (_event, filename) =>
        onFileChange({
          filename: path.join(dir, filename),
          config,
          argsConfig,
        }),
      );
    }

    for (let file of files) {
      onFileChange({ filename: path.join(dir, file), config, argsConfig });
    }
  });
}

async function watchTypescript({ entryPoints, outdir, watch }) {
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
    allowOverwrite: true,
    sourcemap: true,
    color: true,
    logLevel: "info",
  });

  log(
    "Building typescript: " +
    "\n  " +
    entryPoints.map((entrypoint) => entrypoint.in).join("\n  ") +
    "\n",
  );
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    ctx.dispose();
    ctx = null;
  }

  return ctx;
}

const DEBOUNCER = {
  cache: {},
  time_ms: 100,
  debounce(key, fn) {
    let prevTimer = this.cache[key];
    if (prevTimer != null) {
      clearTimeout(prevTimer);
    }

    let timer = setTimeout(() => {
      fn();
    }, this.time_ms);
    this.cache[key] = timer;
  },
};

function time() {
  let now = new Date();
  let hh = now.getHours();
  let mm = now.getMinutes();
  let ss = now.getSeconds();
  return (
    hh.toString().padStart(2, "0") +
    ":" +
    mm.toString().padStart(2, "0") +
    ":" +
    ss.toString().padStart(2, "0")
  );
}

function log(msg, ...args) {
  console.log(time(), msg, ...args);
}

function onFileChange({ filename, callback, config, argsConfig }) {
  let fn = null;

  if (filename in config.scss) {
    let dst = config.scss[filename];
    fn = () => {
      log(`Compiling SCSS: ${filename}`);
      compileScss(filename, dst);
    };
  } else if (filename in config.manifest) {
    let dst = config.manifest[filename];
    fn = () => {
      log(`Compiling Manifest: ${filename}`);
      compileManifest(filename, dst, argsConfig.browser);
    };
  } else {
    // See if the changed file or any of its parents is a dir that's specified
    // in `config.copy`
    while (filename != "." && filename != "/" && filename != "") {
      if (filename in config.copy) {
        let dst = config.copy[filename];
        fn = () => {
          log(`Copying: ${filename}`);
          fs.cpSync(filename, dst, { force: true, recursive: true });
        };
        break;
      }
      filename = path.dirname(filename);
    }
  }

  if (fn != null) {
    DEBOUNCER.debounce(filename, () => {
      fn();
      if (callback != null) callback();
    });
  }
}

function compileScss(src, dst) {
  let output;
  try {
    output = sass.compile(src, { sourceMap: true });
  } catch (e) {
    log("Error:", e.toString());
    return;
  }

  let dstBaseName = path.basename(dst);
  fs.writeFileSync(
    dst,
    output.css + `\n/*# sourceMappingURL=${dstBaseName}.map */`,
  );
  fs.writeFileSync(dst + ".map", JSON.stringify(output.sourceMap));
}

function compileManifest(src, dst, prefix) {
  let input = fs.readFileSync(src);
  let root = JSON.parse(input);
  let output = fixupManifest(root, prefix);

  fs.writeFileSync(dst, JSON.stringify(output, null, 2));
}

function fixupManifest(root, prefix) {
  prefix = "$" + prefix + ":";

  if (!(root instanceof Object && !Array.isArray(root))) return root;

  let newEntries = [];
  for (let [key, value] of Object.entries(root)) {
    if (key.startsWith("$")) {
      if (key.startsWith(prefix)) {
        key = key.slice(prefix.length);
      } else {
        key = null;
      }
    }
    if (key != null) {
      newEntries.push([key, fixupManifest(value)]);
    }
  }

  return Object.fromEntries(newEntries);
}

await main();
