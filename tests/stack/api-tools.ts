import { delay } from "https://deno.land/std@0.224.0/async/delay.ts";

const apiFile = import.meta.dirname + "/api.ts";

export const startApi = async (): Promise<Deno.ChildProcess> => {
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

  await delay(300);
  return Promise.resolve(startPs);
  // Solution to explore to avoid delay
  // the following implementation lead to "Leaks detected" in tests
  // // detect startup from output
  // return new Promise((resolve) => {
  //   startPs.stdout
  //   .pipeThrough(new TextDecoderStream())
  //   .pipeThrough(
  //       new TransformStream({
  //         transform(chunk, controller) {
  //           if (chunk.includes("listening")) resolve(startPs);
  //           controller.enqueue(chunk);
  //         },
  //       }),
  //     )
  //     .pipeThrough(new TextEncoderStream())
  //     .pipeTo(Deno.stdout.writable);
  // });
};

export const stopApi = async (handle: Deno.ChildProcess) => {
  handle.kill();
  await handle.status;
  await handle.stdout.cancel();
};
