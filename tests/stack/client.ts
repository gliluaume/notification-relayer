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
  (globalThis?.gatewayClient?.socket as unknown as WebSocket).onopen = () => {
    ack(ECommands.logon);
  };
};

const commandsMap = new Map();
const setup = async () => {
  await fetchWsClient();
  globalThis.gatewayClient.log = (message: string) =>
    logger.info(`ℹ️ ${message}`);
  commandsMap.set(ECommands.logon, logon);
  commandsMap.set(ECommands.logout, globalThis.gatewayClient.logout);
  commandsMap.set(ECommands.close, self.close);
  commandsMap.set(
    ECommands.send,
    () =>
      (globalThis?.gatewayClient.socket as unknown as WebSocket).send("test"),
  );
  return ack(ECommands.setup);
};

const logger = getLogger("🫏", "client", {
  head: "color: bisque",
  highlight: "color: magenta",
  error: "color: orange; font-weight: bold",
});

const ack = (type: string) =>
  (self as any).postMessage({ type, message: "acknowledged", status: "ok" });

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

  await cmd!();
  ack(cmdName);
};
