console.log("init")
import("./output.js").then(
  async ({ initialize, config, run, finalize, bip32PrivateKeyFromMnemonic }) => {
  console.log("running")
  console.log(bip32PrivateKeyFromMnemonic("kingdom enforce tennis early sentence tilt mercy tribe palace effort either safe zebra little wrong vital target visual reward exercise coconut piano hungry mercy"))
  // const env = await initialize(config);
  // console.log("after initialise")
  // try {
  //     await run(env);
  // } finally {
  //     await finalize(env);
  // }
});
