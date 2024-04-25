// @deno-types="npm:@types/express@4.17.15"
import express, { Request, Response } from "npm:express@4.19.2";
import { WebSocketServer } from "npm:ws@8.16.0";
import * as path from "https://deno.land/std@0.188.0/path/mod.ts";
import cors from "npm:cors@2.8.5";
import {
  addClientRegistration,
  addNotification,
  addServer,
  getClientRegistration,
  getWssHavingFewestConnectedClients,
  removeClientRegistration,
  removeServer,
} from "./repository.ts";
// alternative: only deno https://blog.logrocket.com/using-websockets-with-deno/
/***************************/
// TODO: do not use multiple addresses / ports: upgrade connections instead: https://examples.deno.land/http-server-websocket
/***************************/
const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const IndexedSockets: Map<string, WebSocket> = new Map();
const publicFolder = "/public";
const port = Deno.env.get("WSS_PORT") || 8000;
const serverName = Deno.env.get("WSS_NAME") || "wss-01";
const serverAddress = Deno.env.get("WSS_ADDRESS") || `http://localhost:${port}`;
const wsAddress = Deno.env.get("WSS_SOCKET_ADDRESS") ||
  `ws://localhost:${port}`;

const checkUuidPattern = (candidate: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .exec(candidate);

let isRegistred = false;
const secureRegisterServer = async () => {
  if (isRegistred) return;
  try {
    await addServer({
      name: serverName,
      address: serverAddress,
      socketAddress: wsAddress,
    });
    isRegistred = true;
  } catch {
    console.error("Registration failed!");
  }
};

console.log(`listening at \x1b[96;4mhttp://localhost:${port}\x1b[0m`);

const app = express();
app.use(
  publicFolder,
  express.static(__dirname + publicFolder),
);
app.use(cors());

app.use(async (req: Request, _res: Response, next) => {
  await secureRegisterServer();
  console.log(`Incoming request: ${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    isRegistred: isRegistred,
    numConnections: IndexedSockets.size,
    name: serverName,
    address: serverAddress,
    socketAddress: wsAddress,
  });
});

/*
  Mimics load balancing on WebSockets:
  - try to have same number of web socket open on each instance
*/
app.get("/socketAddress", async (_req, res) => {
  const target = await getWssHavingFewestConnectedClients();
  console.log("target", target);
  res.json(target);
});

app.post("/notifications/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!checkUuidPattern(id)) {
    console.log("invalid request");
    return res.sendStatus(400);
  }

  const registration = await getClientRegistration(id);
  console.log(registration);

  // const exist = tmp?.rowCount || 0 > 0;
  if (!registration) {
    console.log("target not found");
    return res.sendStatus(404);
  }

  await addNotification(id);
  if (IndexedSockets.has(id)) {
    console.log("client found in current pool");
    IndexedSockets.get(id)!.send(JSON.stringify({
      type: "notification",
      value: "you have got a message",
    }));
  } else {
    console.log("client may live in another instance");
    fetch(`${(registration as any).address}//notifications/${id}`, {
      method: "POST",
    });
  }
  res.send("sent to " + id);
});

const server = app.listen(port);

const wss: WebSocketServer = new WebSocketServer({ server });

wss.on("connection", async (ws: any, req: any) => {
  // TODO search for pending notifications if registration id is not null
  const registrationId =
    (await addClientRegistration(serverName) as any).clientid;
  console.log("new registrationId", registrationId);
  ws.id = registrationId;
  IndexedSockets.set(ws.id, ws);

  ws.on("error", console.error);

  ws.on("message", function message(data: any) {
    console.log("received", data.toString());
  });

  ws.on("close", async () => {
    console.log("closing ws", ws.id);
    await removeClientRegistration(ws.id);
  });

  ws.send(JSON.stringify({
    type: "registration",
    value: ws.id,
  }));
});

// wss.on("upgrade", (_req: any, ws: any) => {
//   if (!isRegistred) {
//     ws.write("HTTP/1.1 500 Retry later\r\n\r\n");
//     ws.destroy();
//     return;
//   }
// });

wss.on("error", (err: any) => {
  console.log("error occurred", err);
});

const terminationHandler = async () => {
  console.log("interrupted!");
  try {
    await removeServer(serverName);
  } finally {
    Deno.exit();
  }
};

Deno.addSignalListener("SIGINT", terminationHandler);
if (Deno.build.os === "linux") {
  Deno.addSignalListener("SIGTERM", terminationHandler);
}
