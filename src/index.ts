
// @deno-types="npm:@types/express@4.17.15"
import express, {Request, Response } from "npm:express@4.19.2";
import { WebSocketServer } from "npm:ws@8.16.0";
import { v4 as uuidv4 } from "npm:uuid@9.0.1";
import * as path from "https://deno.land/std@0.188.0/path/mod.ts";
import { ISessions, MyWebSocket } from "./types.ts";
// alternative: only deno https://blog.logrocket.com/using-websockets-with-deno/

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

const DB_SESSIONS: Map<string, ISessions> = new Map();

// "express": "^4.19.2",
// "lowdb": "^7.0.1",
// "web-push": "^3.6.7"
const publicFolder = '/public';
const port = 8000;
const wsPort = 8002;

console.log(`listening at \x1b[96;4mhttp://localhost:${port}\x1b[0m`);

const app = express();
app.use(
    publicFolder,
    express.static(__dirname + publicFolder));

app.use((req: Request, _res: Response, next) => {
    console.log(`Incoming request: ${req.method} ${req.path}`);
    next();
});

app.post("/notifications/:id", (req: Request, res: Response) => {
    const id = req.params.id;
    // TODO check registration exist in client pool
    // If not, follow to target server (how? Call it directly in http post?)
    // If client is offline, add a pending notification
    res.send("sent to " + id);

    // Use find here, cleanup
    wss.clients.forEach((ws: MyWebSocket) => {
        if (ws?.id === id) {
            ws.send(JSON.stringify({
                type: 'notification',
                value: "you have got a message",
            }));
        }
    });
});

app.listen(port);

const wss: WebSocketServer = new WebSocketServer({ port: wsPort });
wss.on('connection', function connection(ws: any, req: any) {
    // TODO search for pending notifications if registration id is not null
    ws.id = uuidv4();
    DB_SESSIONS.set(ws.id, {
        clientIp: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1',
        socketId: ws.id,
    });

    console.log(DB_SESSIONS);
    // console.log(req.headers);
    ws.on('error', console.error);

    ws.on('message', function message(data: any) {
        console.log('received', data.toString());
    });

    ws.send(JSON.stringify({
        type: 'registration',
        value: ws.id,
    }));
    // console.log('clients', wss.clients);
});

wss.on('error', (err: any) => {
    console.log('error occurred', err);
});
