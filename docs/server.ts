
// @deno-types="npm:@types/express@4.17.15"
import express, {Request } from "npm:express@4.19.2";
import cors from "npm:cors@2.8.5";

const port = 8004;
const callbackGatewayUrl = 'http://localhost:8000';
const delay = 1000;

console.log(`listening at \x1b[96;4mhttp://localhost:${port}\x1b[0m`);

const app = express();
app.use(cors());

app.post("/longrunningstuff", (req: Request, res) => {
    console.log(req.get("x-registration-id"));
    const registrationId = req.get("x-registration-id");
    setTimeout(()=> {
        fetch(`${callbackGatewayUrl}/notifications/${registrationId}`, {
            method: 'POST',
          });
    }, delay);
    res.json({
        message: "will do it, do not worry",
    });
});

app.listen(port);
