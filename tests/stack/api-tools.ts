const apiFile = import.meta.dirname + "/api.ts";

export const startApi = (): Promise<Deno.ChildProcess> => {
  const runApiCmd = new Deno.Command("deno", {
    stdout: "piped",
    // stderr: "piped",
    args: [
      "run",
      "-A",
      apiFile,
    ],
  });
  const startPs = runApiCmd.spawn();
  startPs.ref();

  return new Promise((resolve) => {
    startPs.stdout
      .pipeThrough(
        new TransformStream({
          transform(chunk, controller) {
            const str = (new TextDecoder()).decode(chunk);
            if (str.includes("listening")) resolve(startPs);
            controller.enqueue(chunk);
          },
        }),
      )
      .pipeTo(Deno.stdout.writable, {
        preventClose: true,
        preventCancel: true,
        preventAbort: true,
      });
  });
};

export const stopApi = async (handle: Deno.ChildProcess) => {
  handle.kill();
  await handle.status;
  await handle.stdout.cancel();
};
