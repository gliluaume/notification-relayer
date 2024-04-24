
// @deno-types="npm:@types/express@4.17.15"
import express, {Request } from "npm:express@4.19.2";
import cors from "npm:cors@2.8.5";

const port = 8004;
// We use port to simulate a non sticky loadbalancer behavior
const notificationRelayerUrl = 'http://localhost';
const relayerPorts = [8000];
const delay = 1000;

console.log(`listening at \x1b[96;4mhttp://localhost:${port}\x1b[0m`);

const app = express();
app.use(cors());

let callNum = 0;
app.post("/longrunningstuff", (req: Request, res) => {
    callNum++;
    const port = relayerPorts[callNum % relayerPorts.length];
    console.log(req.get("x-registration-id"));
    const registrationId = req.get("x-registration-id");

    const url = `${notificationRelayerUrl}:${port}/notifications/${registrationId}`;
    setTimeout(async ()=> {
        console.log("post notification at ", url);
        const response = await fetch(url, {
            method: 'POST',
          });
        const data = await response.text();
        console.log(data);
    }, delay);
    res.json({
        message: "will do it, do not worry",
    });
});

app.listen(port);
