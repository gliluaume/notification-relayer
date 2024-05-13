// export type CmdWssClient = "setup"
//   | "logon"
//   | "logout"
//   | "send"
//   | "callA"
//   | "callB"
//   | "close"
//   | "getHistory"
//   | "clearHistory";

export enum ECommandsWsClient {
  setup = "setup",
  logon = "logon",
  logout = "logout",
  send = "send",
  callA = "callA",
  callB = "callB",
  close = "close",
  getHistory = "getHistory",
  clearHistory = "clearHistory",
}

export enum ECommandsServer {
  listen = "listen",
  setPort = "setPort",
  setParams = "setParams",
}

export interface IAcknowledgement {
  type: string;
  message: string;
  status: ICommandStatus;
  response: any;
}

export type prmsTypes = string | number | boolean;
export interface IParams {
  [key: string]: prmsTypes;
}

export interface ICommandsServer {
  data: {
    command: ECommandsServer;
    params?: IParams;
  };
}

export type ICommandStatus = "ok" | "failure" | "exception";
