(async () => {
  console.log("running")
  const src = chrome.runtime.getURL("./content-script/index.js");
  const contentMain = await import(src);
  contentMain.main();
})();
