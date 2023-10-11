console.log("init")
import("./output.js").then(
  async ({ initialize, config, run, finalize }) => {
  console.log("running")
  const env = await initialize(config);
  try {
      await run(env);
  } finally {
      await finalize(env);
  }
});
