import { ECommands } from "./client-types.ts";

const noop = () => {};

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

console.log("I am a client worker");

export interface ICommandEvent {
  data: {
    command: ECommands;
  };
}

const commandsMap = new Map();
const setup = async () => {
  await fetchWsClient();
  commandsMap.set(ECommands.logon, globalThis.gatewayClient.logon);
  commandsMap.set(ECommands.logout, globalThis.gatewayClient.logout);
  commandsMap.set(ECommands.close, self.close);
  commandsMap.set(
    ECommands.send,
    () =>
      (globalThis.gatewayClient.socket as unknown as WebSocket).send("test"),
  );
};

const logInfo = (text: string, highlight = "") => {
  console.log(
    `%c\n🛒 client %c${text} %c${highlight}`,
    "color: bisque",
    "color: white",
    "color: magenta",
  );
};

const logErr = (text: string) => {
  console.log(
    `%c\n🛒 client %c${text}`,
    "color: bisque",
    "color: orange; font-weight: bold",
  );
};

(self as any).onmessage = async (evt: ICommandEvent) => {
  const cmdName = evt.data.command;
  logInfo("received command", evt.data.command);

  if (cmdName === ECommands.setup) {
    return await setup();
  }
  if (!commandsMap.has(cmdName)) {
    console.warn("unknown command!");
    logErr("unknown command!");
  }
  const cmd = commandsMap.get(cmdName);
  if (!cmd) {
    logErr("command not available!");
  }
  await cmd!();
};
