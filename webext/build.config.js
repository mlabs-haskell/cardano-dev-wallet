export default {
  buildDir: "build",
  copy: {
    "src/popup/trampoline.html": "popup/trampoline.html",
    "src/popup/trampoline.js": "popup/trampoline.js",
    "src/popup/index.html": "popup/index.html",
    "src/popup/static": "popup/static",
    "src/background/background.js": "background/background.js",
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
  manifest: {
    "src/manifest.json": "manifest.json"
  }
}
