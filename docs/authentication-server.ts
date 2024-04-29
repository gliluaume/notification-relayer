
// @deno-types="npm:@types/express@4.17.15"
import express, { Request } from "npm:express@4.19.2";
import cors from "npm:cors@2.8.5";

const port = 8005;

console.log(`Authentication service listening at \x1b[96;4mhttp://localhost:${port}\x1b[0m`);

const app = express();
app.use(cors());

app.get("/users", (req: Request, res) => {
    console.log(req.path);
    console.log((req as any).headers);
    res.status(200).send("ok");
});

app.listen(port);
