// import { type GlobalThis } from "https://deno.land/x/fest@4.13.2/source/global-this.d.ts";
import { ECommandsWsClient, ICommandStatus } from "./commands-types.ts";
import { getLogger } from "../get-logger.ts";

// type ExtraGlobals = GlobalThis & {
// 	readonly GLOBAL_TOKEN: string;
// };
// (globalThis as ExtraGlobals).GLOBAL_TOKEN;

// This client is here to emulate some browser behavior about WebSockets

(globalThis as any).localStorage = {
  _data: {},
  removeItem: function (key: string) {
    delete this._data[key];
  },
  getItem: function (key: string) {
    return this._data[key];
  },
  setItem: function (key: string, value: any) {
    this._data[key] = value;
  },
};

const fetchWsClient = async () => {
  const serverDomain = "localhost:8000";
  const response = await fetch(`http://${serverDomain}/public/client.js`);
  const str = await response.text();
  eval(str);
};

export interface ICommandWsClient {
  data: {
    command: ECommandsWsClient;
  };
}

const logon = async () => {
  await globalThis.gatewayClient.logon();
  ws().onopen = () => {
    ack(ECommandsWsClient.logon);
  };
  ws().addEventListener("message", (event) => {
    webSocketHistory.push(event);
  });
  ws().addEventListener("error", (event: Event) => {
    ack(ECommandsWsClient.logon, event, "failure");
  });
};

const callGen = (p: number) => async () => {
  logger.info(`http://localhost:8004/longrunningstuff/${p}`);
  const response = await fetch(`http://localhost:8004/longrunningstuff/${p}`, {
    method: "POST",
    mode: "cors", // no-cors, *cors, same-origin
    cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      "x-registration-id": globalThis.gatewayClient.registrationId(),
    },
    redirect: "follow",
  });
  return response.json();
};

const callA = callGen(8000);
const callB = callGen(8010);
const ws = () => globalThis?.gatewayClient.socket as unknown as WebSocket;
let webSocketHistory: any[] = [];

const commandsMap = new Map();
const setup = async () => {
  await fetchWsClient();
  globalThis.gatewayClient.log = (...args: any[]) => logger.log("ℹ️", ...args);

  commandsMap.set(ECommandsWsClient.logon, logon);
  commandsMap.set(ECommandsWsClient.callA, callA);
  commandsMap.set(ECommandsWsClient.callB, callB);
  commandsMap.set(ECommandsWsClient.send, () => ws().send("test"));
  commandsMap.set(ECommandsWsClient.getHistory, () => webSocketHistory);
  commandsMap.set(ECommandsWsClient.clearHistory, () => {
    webSocketHistory = [];
  });
  commandsMap.set(ECommandsWsClient.logout, globalThis.gatewayClient.logout);
  commandsMap.set(ECommandsWsClient.close, self.close);

  return ack(ECommandsWsClient.setup);
};

const logger = getLogger("🦄", "client", {
  head: "color: bisque",
  highlight: "color: magenta",
  error: "color: orange; font-weight: bold",
});

const ack = (type: string, response?: any, status: ICommandStatus = "ok") =>
  (self as any).postMessage({
    type,
    message: "acknowledged",
    status,
    response,
  });

(self as any).onmessage = async (evt: ICommandWsClient) => {
  const cmdName = evt.data.command;
  try {
    logger.info("received command", cmdName);
    if (cmdName === ECommandsWsClient.setup) {
      return await setup();
    }
    if (cmdName === ECommandsWsClient.logon) {
      return await logon();
    }
    if (!commandsMap.has(cmdName)) {
      logger.error("unknown command!" + cmdName);
      return ack(cmdName, "unknown command", "failure");
    }
    const cmd = commandsMap.get(cmdName);
    if (!cmd) {
      logger.error("command not available!");
      return ack(cmdName, "command not available", "failure");
    }
    const response = await cmd!();
    return ack(cmdName, response);
  } catch (e) {
    return ack(cmdName, e, "exception");
  }
};
