export enum ECommands {
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

export interface IAcknowledgement {
  type: string;
  message: string;
  status: string;
  response: any;
}
