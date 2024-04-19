
// @deno-types="npm:@types/express@4.17.15"
import express, {Request, Response } from "npm:express@4.19.2";
import { WebSocketServer } from "npm:ws@8.16.0";
import { v4 as uuidv4 } from "npm:uuid@9.0.1";

import * as path from "https://deno.land/std@0.188.0/path/mod.ts";
import { ISessions, MyWebSocket } from "./types.ts";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

const DB_SESSIONS: Map<string, ISessions> = new Map();

// "express": "^4.19.2",
// "lowdb": "^7.0.1",
// "web-push": "^3.6.7"
const publicFolder = '/public';
const port = 8000;

console.log(`listening at \x1b[96;4mhttp://localhost:${port}\x1b[0m`);

const app = express();
app.use(
    publicFolder,
    express.static(__dirname + publicFolder));

app.use((req, _res, next) => {
    console.log(`Incoming request: ${req.method} ${req.path}`);
    next();
});

app.post("/notifications/:id", (req, res) => {
    const id = req.params.id;
    // DB_SESSIONS.set(id, {clientIp: '234234', socketId: 'toto'})
    res.send("sent to " + id);
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

const wss = new WebSocketServer({ port: 8002 });
wss.on('connection', function connection(ws: any, req: any) {
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
