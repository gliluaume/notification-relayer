const apiFile = import.meta.dirname + "/api.ts";

export const startApi = async () => {
  const runApiCmd = new Deno.Command("deno", {
    args: [
      "run",
      "-A",
      apiFile,
    ],
  });
  const startPs = runApiCmd.spawn();
  startPs.ref();
  await startPs.status;
  return startPs;
};

export const stopApi = async (handle: Deno.ChildProcess) => {
  handle.kill();
  await handle.status;
};
