// @deno-types="npm:@types/express@4.17.15"
import { colors } from "https://deno.land/x/cliffy@v1.0.0-rc.4/ansi/colors.ts";
import express, { Request, Response } from "npm:express@4.19.2";
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

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const IndexedSockets: Map<string, WebSocket> = new Map();
const publicFolder = "/public";
const port = Deno.env.get("WSS_PORT") || 8000;
const serverName = Deno.env.get("WSS_NAME") || "wss-01";
const serverAddress = Deno.env.get("WSS_ADDRESS") || `http://localhost:${port}`;
const wsAddress = Deno.env.get("WSS_SOCKET_ADDRESS") ||
  `ws://localhost:${port}`;
const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";
const useAuthProvider = Deno.env.get("WSS_CHECK_AUTH") === "true";
const authProvider = Deno.env.get("WSS_AUTH_PROVIDER") ||
  "http://localhost:8005/users";

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

function onSocketError(err: any) {
  console.error(err);
}

// sub-protocol identification header as we only set client Id here
// TODO here we have a abusive usage of sec-websocket-protocol
const getSocketId = (request: IncomingMessageForServer) =>
  request.headers["sec-websocket-key"];
const getClientId = (request: IncomingMessageForServer) =>
  request.headers["sec-websocket-protocol"];

console.log(`listening at \x1b[96;4mhttp://localhost:${port}\x1b[0m`);

const app = express();
app.use(
  publicFolder,
  express.static(__dirname + publicFolder),
);
app.use(cors());

app.use(async (req: Request, _res: Response, next: any) => {
  await secureRegisterServer();
  console.log(`Incoming request: ${req.method} ${req.path}`);
  next();
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    isRegistred: isRegistred,
    numConnections: IndexedSockets.size,
    name: serverName,
    address: serverAddress,
    socketAddress: wsAddress,
  });
});

// Mimics load balancing on WebSockets: try to have same number of web socket open on each instance
// TODO: rename POST /registrations/:id
app.post(
  "/socketAddresses/:id",
  async (request: Request, response: Response) => {
    if (!checkUuidPattern(request.params.id)) {
      response.status(400).send("Bad parameter");
      return;
    }

    // check authent by calling configurable endpoint, continue or send unauthorized
    if (useAuthProvider) {
      console.log("calling auth provider");
      const authResultResponse = await fetch(authProvider, {
        headers: request.headers,
      });
      if (authResultResponse.status >= 400) {
        response.status(401).send("Unauthorized");
        return;
      }
    }

    const id = request.params.id;
    const target = await getWssHavingFewestConnectedClients();

    // Client have to persist client id and return it to be authenticated
    let registrationId: string | null = null;
    if (id === EMPTY_UUID) {
      registrationId = (await addClientRegistration(target.name)).clientid ||
        null;
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
  },
);

app.post("/notifications/:clientId", async (req: Request, res: Response) => {
  const clientId = req.params.clientId;
  if (!checkUuidPattern(clientId)) {
    console.log("invalid request");
    return res.sendStatus(400);
  }

  const registration = await getClientRegistration(clientId);
  console.log("registration", registration);

  if (!registration) {
    console.log("target not found");
    return res.sendStatus(404);
  }

  await addNotification(clientId);
  if (IndexedSockets.has(clientId)) {
    console.log("client found in current pool");
    IndexedSockets.get(clientId)!.send(JSON.stringify({
      type: "notification",
      value: "you have got a message",
    }));
  } else {
    console.log("client may live in another instance");
    fetch(`${registration.address}/notifications/${clientId}`, {
      method: "POST",
    });
  }
  res.send("sent to " + clientId);
});

const server = app.listen(port);
const wss: WebSocketServer = new WebSocketServer({ server });

server.on(
  "upgrade",
  async (request: IncomingMessageForServer, socket: WebSocket) => {
    socket.on("error", onSocketError);

    const socketId = getSocketId(request);
    const claimedId = getClientId(request);
    console.log("socketId, claimedId", socketId, claimedId);
    const isKnown = claimedId && !!(await getClientRegistration(claimedId));
    if (!isKnown) {
      console.log("rejecting connection");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    console.log("upgrading connection");
    socket.removeListener("error", onSocketError);
    await patchClientRegistration(claimedId, socketId);
    console.log("end of upgrading");
  },
);

const sendThrough = (ws: WebSocket, message: string) => {
  console.log(colors.green("🠝 ") + message);
  ws.send(message);
};

wss.on(
  "connection",
  (ws: WebSocket, request: IncomingMessageForServer, response: Response) => {
    console.log("response", response);
    console.log("connection", request.headers);
    ws.wssn = { id: getSocketId(request), clientId: getClientId(request) };
    console.log("ws.wssn", ws.wssn);

    if (!ws.wssn.clientId) {
      console.log("rejecting connection");
      ws.close();
      // ws.destroy();
      return;
    }

    IndexedSockets.set(ws.wssn.clientId, ws);
    ws.on("error", console.error);

    ws.on("open", (data: ArrayBuffer) => {
      console.log("open", data.toString());
      sendThrough(ws, "Hello?");
    });

    ws.on("message", (data: ArrayBuffer) => {
      console.log(colors.red("🠟"), data.toString());
    });

    ws.on("close", async () => {
      console.log("closing ws", ws.wssn.clientId);
      if (IndexedSockets.has(ws.wssn.clientId)) {
        await removeClientRegistration(ws.wssn.clientId);
        IndexedSockets.delete(ws.wssn.clientId);
      }
    });

    sendThrough(ws, "Hello from server to client");
  },
);

wss.on("error", (err: WebSocketError) => {
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
