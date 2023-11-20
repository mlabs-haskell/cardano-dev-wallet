import * as base from "@playwright/test";
import * as path from "node:path";
import * as url from "node:url";

import * as firefoxRemote from "../node_modules/web-ext/lib/firefox/remote.js";
import { argv } from "node:process";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const pathToExtension = path.join(__dirname, "../build");

const chromium = base.chromium;
const expect = base.expect;
const firefox = base.firefox;

const RDP_PORT = 12345;
const POPUP_PAGE = "popup/index.html";

const test = base.test.extend({
  context: async ({ browserName }, use) => {
    let context;
    if (browserName == "chromium") {
      context = await chromium.launchPersistentContext("", {
        headless: false,
        args: [
          `--disable-extensions-except=${pathToExtension}`,
          `--load-extension=${pathToExtension}`,
        ],
      });
    } else if (browserName == "firefox") {
      context = await firefox.launch({
        headless: false,
        args: ["-start-debugger-server", String(RDP_PORT)],
        firefoxUserPrefs: {
          "devtools.debugger.remote-enabled": true,
          "devtools.debugger.prompt-connection": false,
        },
      });

      const client = await firefoxRemote.connect(RDP_PORT);
      const resp = await client.installTemporaryAddon(pathToExtension);
      context.ffExtId = resp.addon.id;
      console.log("Installed addon with ID", resp.addon.id);
    } else {
      throw new Error("Unknown browser: " + browser);
    }
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    if (!context.ffExtId) {
      // for manifest v3:
      let [background] = context.serviceWorkers();
      if (!background) background = await context.waitForEvent("serviceworker");
      const extensionId = background.url().split("/")[2];
      await use(extensionId);
    } else {
      await use(context.ffExtId);
    }
  },
});

test("Open popup", async ({ extensionId, page, context, browserName }) => {
  console.log(extensionId);

  let extPage = page;
  if (browserName == "firefox") {
    extPage.goto("moz-extension://" + extensionId + "/" + POPUP_PAGE);
  } else {
    extPage.goto("chrome-extension://" + extensionId + "/" + POPUP_PAGE);
  }

  await extPage.bringToFront();
  await extPage
    .getByTestId("mnemonicOrPk")
    .fill(
      "adult buyer hover fetch affair moon arctic hidden doll gasp object dumb royal kite brave robust thumb speed shine nerve token budget blame welcome"
    );
  await extPage.getByText("Convert").click();

  let expectedAddresses = [
    "addr1q9d06r5h5uktqanvdyd07y747yllfst7rd025y3g0xmwdpwx5mfvatq23xwn72rnygnjvwlj808x4w0eq4ttqts2fums7qp6ll",
    "addr1qx84xgzgxummpupsgvy8wc886sk3wv53p2cmsscz2zh2lr65u5ve052fnyqqll6q5qz0ne7gdca7c9llm4taaqdxxt6sj4fwcg",
  ];

  for (let addr of expectedAddresses) {
    await expect(extPage.getByText(addr, { exact: true })).toBeAttached();
  }
});
