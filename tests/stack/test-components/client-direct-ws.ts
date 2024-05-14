import {
  ECommandsWsBadClient,
  ICommandStatus,
  ICommandsWsBadClient,
} from "./commands-types.ts";
import { getLogger } from "../get-logger.ts";

const logger = getLogger("👻", "hacker", {
  head: "color: gray",
  highlight: "color: lch",
  error: "color: red; font-weight: bold",
});

const ack = (
  type: string,
  response?: any,
  status: ICommandStatus = "ok",
  message: string = "acknowledged",
) =>
  (self as any).postMessage({
    type,
    message,
    status,
    response,
  });

(self as any).onmessage = async (evt: ICommandsWsBadClient) => {
  const cmdName = evt.data.command;
  try {
    logger.info("received command", cmdName);
    if (cmdName === ECommandsWsBadClient.openRawNoUuid) {
      return await openRawNoUuid();
    }
    if (cmdName === ECommandsWsBadClient.openRawWithUuid) {
      return await openRawWithUuid();
    }
    if (cmdName === ECommandsWsBadClient.send) {
      return await send();
    }
    logger.error("command not available!");
    return ack(cmdName, "command not available", "failure");
  } catch (e) {
    return ack(cmdName, e, "exception", e.message);
  }
};

let ws: WebSocket;
const openRawNoUuid = () => {
  logger.info("Opening raw Web Socket");
  ws = new WebSocket("ws://localhost:8000");
  ws.addEventListener("open", () => {
    logger.info("on open raw Web Socket");
  });
  ack(ECommandsWsBadClient.openRawNoUuid);
  return ws;
};

const send = () => {
  if (!ws) throw new Error("Invalid call to WebSocket");
  ws.send("from bad client");
  ack(ECommandsWsBadClient.send);
};

const openRawWithUuid = () => {
  logger.info("Opening Web Socket with a uuid");
  ws = new WebSocket(
    "ws://localhost:8000",
    "edb830dc-453e-449e-a10d-53aa07d1ac6e",
  );
  ws.addEventListener("open", () => {
    logger.info("on open Web Socket with a uuid");
  });
  ack(ECommandsWsBadClient.openRawWithUuid);
  return ws;
};
