import { delay } from "https://deno.land/std@0.214.0/async/delay.ts";
import { Commander } from "./commander.ts";
import { ECommandsServer, ECommandsWsClient } from "./commands-types.ts";

// Testing commander
const wsClientCmdr = new Commander<ECommandsWsClient>(
  "clientCmdr",
  import.meta.resolve("./client.ts"),
);

await wsClientCmdr.postThenReceive(ECommandsWsClient.logon);
await wsClientCmdr.postThenReceive(ECommandsWsClient.send);
await wsClientCmdr.postThenReceive(ECommandsWsClient.logout);

const authApiCmdr = new Commander<ECommandsServer>(
  "authApiCmdr",
  import.meta.resolve("./auth-server.ts"),
);
await authApiCmdr.postThenReceive(ECommandsServer.listen, {
  port: 1234,
  mode: "error",
});

const backendApiCmdr = new Commander<ECommandsServer>(
  "backendApiCmdr",
  import.meta.resolve("./api.ts"),
);
await backendApiCmdr.postThenReceive(ECommandsServer.listen, {
  port: 1234,
  mode: "error",
});

await delay(1500);
await authApiCmdr.stop();
await backendApiCmdr.stop();
wsClientCmdr.postAndForget(ECommandsWsClient.close);
