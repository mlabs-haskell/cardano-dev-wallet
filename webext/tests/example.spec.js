import * as base from "@playwright/test";
import * as path from "node:path";
import * as url from "node:url";

console.log("Starting");

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const pathToExtension = path.join(__dirname, "../build");

const chromium = base.chromium;
const expect = base.expect;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const POPUP_PAGE = "popup/index.html";

const BLOCKFROST_PROJECTID = "preview78FY83hxBjCnSF8zpQv8nwyMUPrOjz6R";
const OGMIOS_URL = "ogmios.preview.ctl-runtime.staging.mlabs.city"
const KUPO_URL = "kupo.preview.ctl-runtime.staging.mlabs.city"
const CTL_TEST_SUCCESS_MARKER = "[CTL TEST SUCCESS]";
const WALLET_ROOT_KEY =
  "adult buyer hover fetch affair moon arctic hidden doll gasp object dumb royal kite brave robust thumb speed shine nerve token budget blame welcome";

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
    } else {
      throw new Error("Browser not supported: " + browser);
    }
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // for manifest v3:
    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent("serviceworker");
    const extensionId = background.url().split("/")[2];
    await use(extensionId);
  },
});

test("Open popup", async ({ extensionId, page, context }) => {
  test.setTimeout(1e9);

  console.log(extensionId);

  let extPage = page;
  extPage.goto("chrome-extension://" + extensionId + "/" + POPUP_PAGE);

  await extPage.bringToFront();
  await extPage.getByText("preview").click();

  // Setup Network
  {
    await extPage.getByText("Network", { exact: true }).click();

    await extPage.getByText("Add", { exact: true }).click();

    // await extPage.getByLabel("Name", { exact: true }).fill("Blockfrost");
    // await extPage
    //   .locator("label", { hasText: "Type" })
    //   .locator("button", { hasText: "Blockfrost" })
    //   .click();
    //
    // await extPage
    //   .getByLabel("ProjectId", { exact: true })
    //   .fill(BLOCKFROST_PROJECTID);


    await extPage.getByLabel("Name", { exact: true }).fill("Ogmios/Kupo");
    await extPage
      .locator("label", { hasText: "Type" })
      .locator("button", { hasText: "Ogmios/Kupo" })
      .click();

    await extPage
      .getByLabel("Ogmios URL")
      .fill(OGMIOS_URL);

    await extPage
      .getByLabel("Kupo URL")
      .fill(KUPO_URL);

    await extPage.getByText("Save", { exact: true }).click();

    let backend = extPage.locator("article", { hasText: "Ogmios/Kupo" });

    await backend.getByText("Options").click();
    await backend.getByText("Set Active").click();
  }

  // Setup Accounts
  {
    await extPage.getByText("Accounts", { exact: true }).click();

    await extPage.getByText("Add Wallet", { exact: true }).click();

    await extPage.getByLabel("Name", { exact: true }).fill("Test Wallet");
    await extPage
      .getByLabel("Root Key or Mnemonics", { exact: true })
      .fill(WALLET_ROOT_KEY);

    await extPage.getByText("Save", { exact: true }).click();

    await extPage.getByText("Add Account", { exact: true }).click();
    await extPage.getByLabel("m(1852'/1815'/_)", { exact: true }).fill("0");

    await extPage.getByText("Save", { exact: true }).click();

    let account = extPage.locator("article", {
      hasText: "m(1852'/1815'/0')",
      hasNot: extPage.locator("article"),
    });

    await account.getByText("Options", { exact: true }).click();

    await account.getByText("Set Active", { exact: true }).click();
  }

  await extPage.getByText("Overview", { exact: true }).click();

  let balance = extPage
    .locator("article", {
      hasText: "Balance",
      hasNot: extPage.locator("article"),
    })
    .locator("input");

  // Wait for page to load
  await expect(balance).toHaveValue("...");
  await expect(balance).not.toHaveValue("...", { timeout: 100000 });

  {
    let page = await context.newPage();
    await page.bringToFront();

    await page.goto("http://localhost:4008");

    page.on("dialog", (dialog) => {
      dialog.accept(BLOCKFROST_PROJECTID);
    });
    page.getByText("Set Blockfrost API Key").click();
    await page.getByText("Blockfrost key is set").waitFor();

    // await page
    //   .locator(":has-text('Environment') + select")
    //   .selectOption("nami");
    // .selectOption("blockfrost-nami-preview");

    await page
      .locator(":has-text('Example') + select").waitFor()
    let tests = await page
      .locator(":has-text('Example') + select")
      .locator("option")
      .all()
      .then((options) =>
        Promise.all(options.map((option) => option.textContent())),
      );

    const runTest = async (testName) => {

      let testDone = new Promise(async (resolve, reject) => {
        let exited = false;

        const onConsole = (msg) => {
          if (msg.text().includes(CTL_TEST_SUCCESS_MARKER)) {
            resolve()
          }
        }
        const onError = (error) => {
          if (!exited) {
            cleanup();
            reject(`[${testName}]: Error thrown by test: ` + JSON.stringify(error.message));
            exited = true;
            return;
          } else {
            console.error(testName + " :: Uncaught error", error);
          }
        }

        const setup = () => {
          page.on('console', onConsole);
          page.on('pageerror', onError);
        };

        const cleanup = () => {
          page.removeListener('console', onConsole);
          page.removeListener('pageerror', onError);
        };

        setup();

        await page.goto(
          "http://localhost:4008?blockfrost-nami-preview:" + testName,
          { waitUntil: "load" },
        );
      });
      return testDone;
    };

    console.log("Tests discovered:", tests);
    console.log()
    let passedTests = [];
    let failedTests = [];

    for (let i = 0; i < tests.length; i++) {
      let test = tests[i];
      let progress = `[${i + 1}/${tests.length}]`
      console.log(progress + " Test:", test);
      try {
        await runTest(test);
        console.log("Pass");
        passedTests.push(test);
      } catch (e) {
        console.log("Fail:", e);
        failedTests.push(test);
      }
      console.log()
      await sleep(2000);
    }

    console.log("Passed", passedTests.length, passedTests);
    console.log("Failed", failedTests.length, failedTests);
  }
});

