// @deno-types="npm:@types/express@4.17.15"
import express, { Request, Response } from "npm:express@4.19.2";
import { WebSocketServer } from "npm:ws@8.16.0";
import * as path from "https://deno.land/std@0.188.0/path/mod.ts";
import { ISessions, MyWebSocket } from "./types.ts";
import {
  addClientRegistration,
  addNotification,
  addServer,
  getClientRegistration,
  removeClientRegistration,
  removeServer,
} from "./repository.ts";
// alternative: only deno https://blog.logrocket.com/using-websockets-with-deno/

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const IndexedSockets: Map<string, ISessions> = new Map();
const publicFolder = "/public";
const port = 8000;
const wsPort = 8002;
const serverName = Deno.env.get("WSS_NAME") || "wss-01";
const serverAddress = Deno.env.get("WSS_ADDRESS") || `http://localhost:${port}`;

const checkUuidPattern = (candidate: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    .exec(candidate);

await addServer({
  name: serverName,
  address: serverAddress,
});

console.log(`listening at \x1b[96;4mhttp://localhost:${port}\x1b[0m`);

const app = express();
app.use(
  publicFolder,
  express.static(__dirname + publicFolder),
);

app.use((req: Request, _res: Response, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  next();
});

app.post("/notifications/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  if (!checkUuidPattern(id)) return res.sendStatus(400);
  const exist = await getClientRegistration(id);

  await addNotification(id);
  // TODO check registration exist in client pool
  // If not, follow to target server (how? Call it directly in http post?)
  // If client is offline, add a pending notification
  res.send("sent to " + id);

  // // Use find here, cleanup
  // wss.clients.forEach((ws: MyWebSocket) => {
  //   if (ws?.id === id) {
  //     ws.send(JSON.stringify({
  //       type: "notification",
  //       value: "you have got a message",
  //     }));
  //   }
  // });
});

app.listen(port);

const wss: WebSocketServer = new WebSocketServer({ port: wsPort });
wss.on("connection", async (ws: any, req: any) => {
  // TODO search for pending notifications if registration id is not null
  const registrationId = await addClientRegistration(serverName);
  console.log("new registrationId", registrationId);
  console.log(IndexedSockets);
  ws.id = registrationId;
  IndexedSockets.set(ws.id, {
    clientIp: req.headers["x-forwarded-for"] || req.socket.remoteAddress ||
      "127.0.0.1",
    socketId: ws.id,
  });

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
  // console.log('clients', wss.clients);
});

wss.on("error", (err: any) => {
  console.log("error occurred", err);
});

Deno.addSignalListener("SIGINT", async () => {
  console.log("interrupted!");
  try {
    await removeServer(serverName);
  } finally {
    Deno.exit();
  }
});
