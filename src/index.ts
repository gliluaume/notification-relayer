// @deno-types="npm:@types/express@4.17.15"
import express, { Request, request, Response } from "npm:express@4.19.2";
import {
  IncomingMessageForServer,
  WebSocket,
  WebSocketServer,
} from "npm:ws@8.16.0";
import * as path from "https://deno.land/std@0.188.0/path/mod.ts";
import cors from "npm:cors@2.8.5";
import {
  addClientRegistration,
  addNotification,
  addServer,
  getClientRegistration,
  getWssHavingFewestConnectedClients,
  patchClientRegistration,
  removeClientRegistration,
  removeServer,
} from "./repository.ts";
import { DenoStdInternalError } from "https://deno.land/std@0.188.0/_util/asserts.ts";
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
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

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

  TODO: check authentication here
*/
app.post("/socketAddresses/:id", async (request, response) => {
  if (!checkUuidPattern(request.params.id)) {
    response.status(400).send("Bad parameter");
    return;
  }

  // TODO evaluate we can we use fetch.redirect(url) as in
  // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch ?

  const id = request.params.id;
  const target = await getWssHavingFewestConnectedClients();

  // TODO return a new registration ID here
  // Client have to persist it and return to be authenticated
  let registrationId: string | null = null;
  if (id === EMPTY_UUID) {
    registrationId = (await addClientRegistration(serverName)).clientid || null;
    console.log("new registrationId", registrationId);
  } else {
    // Check reg exists
    const result = await getClientRegistration(id);
    if (!result) {
      console.log("target not found");
      return response.sendStatus(404);
    }
    registrationId = result.clientId;
  }
  target.registrationId = registrationId;
  response.json(target);
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

server.on(
  "upgrade",
  async (request: IncomingMessageForServer, socket: WebSocket) => {
    console.log("Sec-WebSocket-Key", request.headers["sec-websocket-key"]);
    console.log(
      "Sec-WebSocket-Protocol",
      request.headers["sec-websocket-protocol"],
    );
    const socketId = request.headers["sec-websocket-key"];
    const claimedId = request.headers["sec-websocket-protocol"];

    console.log("upgrading connection");
    const isKnown = !!(await getClientRegistration(claimedId));
    if (!isKnown) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    await patchClientRegistration(claimedId, socketId);
  },
);

wss.on("connection", (ws: WebSocket, _req: IncomingMessageForServer) => {
  // TODO search for pending notifications if registration id is not null
  // const registrationId =
  //   (await addClientRegistration(serverName) as any).clientid;
  // console.log("new registrationId", registrationId);
  // ws.id = registrationId;
  // IndexedSockets.set(ws.id, ws);
  // console.log("request", _req?.data?.toString());
  ws.on("error", console.error);

  ws.on("open", (data: ArrayBuffer) => {
    console.log("open", data.toString());
  });

  ws.on("message", async (data: ArrayBuffer) => {
    /*
    console.log("received", data.toString());
    // proto
    // declare registrationId
    const str = data.toString();
    const matchDeclareReg = /^declare-registration-id (?<registrationId>[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$)/
      .exec(str);
    let unknownRegistration = false;
    if (matchDeclareReg?.groups) {
      // TODO: check it is related to some existing registration
      // if not, create new (secu?)
      const regId = matchDeclareReg.groups!.registrationId;
      const results = await getClientRegistration(regId);
      console.log(results);
      if (!results) {
        console.log("unknown registration id", regId);
        unknownRegistration = true;
      } else {
        console.log("using registration id from client");
        ws.id = matchDeclareReg.groups!.registrationId;
        IndexedSockets.set(ws.id, ws);
      }
    }

    if (str === "get-registration-id" || unknownRegistration) {
      const registrationId =
        (await addClientRegistration(serverName) as any).clientid;
      console.log("new registrationId", registrationId);
      ws.id = registrationId;
      IndexedSockets.set(ws.id, ws);
      ws.send(JSON.stringify({
        type: "registration",
        value: ws.id,
      }));
    }
    */
  });

  ws.on("close", async () => {
    console.log("closing ws", ws.id);
    if (IndexedSockets.has(ws.id)) {
      await removeClientRegistration(ws.id);
      IndexedSockets.delete(ws.id);
    }
  });

  // ws.send(JSON.stringify({
  //   type: "registration",
  //   value: ws.id,
  // }));
  ws.send(JSON.stringify({ message: "hello" }));
});

// wss.on("upgrade", (_req: any, ws: any) => {
//   console.log("upgrading connection");
// });

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

// Does not work with docker stop. Hope it will with kubernetes
Deno.addSignalListener("SIGINT", terminationHandler);
console.log(`Os detected: ${Deno.build.os}`);

if (Deno.build.os === "linux") {
  Deno.addSignalListener("SIGABRT", terminationHandler);
  // Deno.addSignalListener("SIGKILL", terminationHandler);
  Deno.addSignalListener("SIGTERM", terminationHandler);
}
