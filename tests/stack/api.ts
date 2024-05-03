// @deno-types="npm:@types/express@4.17.15"
import express, { Request } from "npm:express@4.19.2";
import cors from "npm:cors@2.8.5";
import { getLogger } from "./get-logger.ts";

const logger = getLogger("💻", "api", {
  head: "color: aquamarine",
  highlight: "color: chartreuse",
  error: "color: orange; font-weight: bold",
});

const port = 8004;
// We use port to simulate a non sticky loadbalancer behavior
const notificationRelayerUrl = "http://localhost:8000";
const delay = Number(Deno.args[0] || 200);

logger.info(`listening at \x1b[96;4mhttp://localhost:${port}\x1b[0m`);

const app = express();
app.use(cors());

let callNum = 0;
app.post("/longrunningstuff", (req: Request, res) => {
  callNum++;
  const registrationId = req.get("x-registration-id");
  logger.info("received registration id", registrationId);

  setTimeout(async () => {
    logger.info("post notification at ", notificationRelayerUrl);
    const response = await fetch(notificationRelayerUrl, {
      method: "POST",
    });
    const data = await response.text();
    logger.data("from relayer", data);
  }, delay);
  res.json({
    message: "will do it, do not worry",
  });
});

app.listen(port);
