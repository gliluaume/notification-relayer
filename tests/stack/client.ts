import { ECommands } from "./client-types.ts";
import { getLogger } from "./get-logger.ts";

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

export interface ICommandEvent {
  data: {
    command: ECommands;
  };
}

const logon = async () => {
  await globalThis.gatewayClient.logon();
  ws().onopen = () => {
    ack(ECommands.logon);
  };
  ws().addEventListener("message", (event) => {
    webSocketHistory.push(event);
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

  commandsMap.set(ECommands.logon, logon);
  commandsMap.set(ECommands.callA, callA);
  commandsMap.set(ECommands.callB, callB);
  commandsMap.set(ECommands.send, () => ws().send("test"));
  commandsMap.set(ECommands.getHistory, () => webSocketHistory);
  commandsMap.set(ECommands.clearHistory, () => {
    webSocketHistory = [];
  });
  commandsMap.set(ECommands.logout, globalThis.gatewayClient.logout);
  commandsMap.set(ECommands.close, self.close);

  return ack(ECommands.setup);
};

const logger = getLogger("🫏", "client", {
  head: "color: bisque",
  highlight: "color: magenta",
  error: "color: orange; font-weight: bold",
});

const ack = (type: string, response?: any) =>
  (self as any).postMessage({
    type,
    message: "acknowledged",
    status: "ok",
    response,
  });

(self as any).onmessage = async (evt: ICommandEvent) => {
  const cmdName = evt.data.command;
  logger.info("received command", cmdName);
  if (cmdName === ECommands.setup) {
    return await setup();
  }
  if (cmdName === ECommands.logon) {
    return await logon();
  }
  if (!commandsMap.has(cmdName)) {
    logger.error("unknown command!" + cmdName);
  }
  const cmd = commandsMap.get(cmdName);
  if (!cmd) {
    logger.error("command not available!");
  }

  const response = await cmd!();
  ack(cmdName, response);
};
