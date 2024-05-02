import { delay } from "https://deno.land/std@0.224.0/async/delay.ts";
import { ECommands } from "./client-types.ts";

const clientScript = import.meta.dirname + "/client.ts";

export const runClient = new Deno.Command("deno", {
  args: [
    "run",
    "-A",
    clientScript,
  ],
});

// use Worker from test file
const worker = new Worker(import.meta.resolve("./client.ts"), {
  type: "module",
  name: "client-mock",
});

worker.postMessage({ command: ECommands.setup });
await delay(2000);
worker.postMessage({ command: ECommands.logon });
await delay(3000);
worker.postMessage({ command: ECommands.send });
await delay(3000);
worker.postMessage({ command: ECommands.logout });
await delay(3000);
worker.postMessage({ command: ECommands.close });
