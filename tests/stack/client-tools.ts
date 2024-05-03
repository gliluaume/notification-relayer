import { ECommands } from "./client-types.ts";
import { getLogger } from "./get-logger.ts";

// const clientScript = import.meta.dirname + "/client.ts";

// export const runClient = new Deno.Command("deno", {
//   args: [
//     "run",
//     "-A",
//     clientScript,
//   ],
// });

// use Worker from test file
const worker = new Worker(import.meta.resolve("./client.ts"), {
  type: "module",
  name: "client-mock",
});

const WAIT_DURATION = 5000;

const logger = getLogger("🦄", "commander", {
  head: "color: cadetblue",
  highlight: "color: blue",
  error: "color: red",
});

const postThenReceive = (
  worker: Worker,
  command: ECommands,
  wait = WAIT_DURATION,
) =>
  new Promise((resolve, reject) => {
    worker.postMessage({ command });
    const timeoutHandle = setTimeout(() => {
      logger.info("time out");
      return reject("timed out!");
    }, wait);
    worker.onmessage = (evt: any) => {
      logger.data("message received in main", evt.data);
      clearTimeout(timeoutHandle);
      resolve(evt.data);
    };
  });

const postAndForget = (
  worker: Worker,
  command: ECommands,
) => worker.postMessage({ command });

await postThenReceive(worker, ECommands.setup);
await postThenReceive(worker, ECommands.logon);
await postThenReceive(worker, ECommands.send);
await postThenReceive(worker, ECommands.logout);
postAndForget(worker, ECommands.close);
