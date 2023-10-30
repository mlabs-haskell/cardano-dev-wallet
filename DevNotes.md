# Developer Notes

### Development Workflow

**Tools Required**:

* `just`: https://github.com/casey/just \
  We use `just` as our task runner as opposed to `package.json` scripts for readability. \
  The tasks are described in `webext/justfile` and `wallet-lib/justfile`.
* `entr`: https://eradman.com/entrproject/ \
  For watching files for changes.

Both of these tools should be available in your distro's repo or homebrew if you're on MacOS.

**Development**

Run `just run {browser}` and `just dev {browser}` in two different terminals and have it running in the background. \
`just dev` will recompile the extension if the sources change. \
`just run` will launch Firefox and will reload the extension if the files in build dir change.

`{browser}` can be `firefox` or `chrome`. If omitted, `firefox` is assumed.

**Bundling**

Run `just bundle {browser}` to create the extension package (crx/xpi).

### Node Polyfills for ESBuild

**History**
* We are currently using https://github.com/imranbarbhuiya/esbuild-plugins-node-modules-polyfill \
  As of this writing (Oct 27, 2023), we are seeing active development on
  this repo; last commit was 4 days ago.
* We tried the following as well:
  * https://github.com/remorses/esbuild-plugins  \
    As per this issue it's known to be broken: https://github.com/remorses/esbuild-plugins/issues/41
  * https://www.npmjs.com/package/esbuild-plugin-polyfill-node  \
    We were getting the issue of `eval()` not allowed in the extension
    context due to security reasons, when we were trying to enable the
    crypto polyfill.

**Notes**
* The `imranbarbhuiya/esbuild-plugins-node-modules-polyfill` library wraps
  the JSPM core libraries. But the ESBuild wrapper itself is maintained by a
  small group of people. This too could go out-of-date/unmaintained some day.

  Keep this in mind if issues with `eval()`s or failed imports of node
  libraries start popping up.


### CTL Dependency

* We need to specify CTL as a dependency in `packages.dhall` as well as
  `package.json`.
  * The former is needed for importing CTL from Purescript.
  * The latter is needed for `esbuild` to resolve the JS dependencies used by CTL for bundling.
    * This works because when we specify CTL as a dependency
      in `package.json`, all the transitive dependencies get pulled in to
      `node_modules` and become available for `esbuild`.
* **Important** Make sure the versions of CTL in both `packages.dhall` and
  `package.json` are the same.
  * Currently we are using the git commit SHA of the latest commit in
   Purescript 0.15 branch.
    * TODO: Once this is merged into master, use the commit SHA of master.
