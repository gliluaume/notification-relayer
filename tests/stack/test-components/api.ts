// @deno-types="npm:@types/express@4.17.15"
import express, { Request, Response } from "npm:express@4.19.2";
import cors from "npm:cors@2.8.5";
import { getLogger } from "../get-logger.ts";
import { ECommandsServer, ICommandsServer } from "./commands-types.ts";

const logger = getLogger("💻", "backendApi", {
  head: "color: lime",
  highlight: "color: chartreuse",
  error: "color: orange; font-weight: bold",
});

export interface IBackendApiParams {
  port: number;
  delay: number;
  notificationRelayerBase: string;
}

const defaultParams: IBackendApiParams = {
  port: 8004,
  delay: 1,
  notificationRelayerBase: "http://localhost",
};

const app = express();
app.use(cors());

const handlerFactory =
  (prms: IBackendApiParams) => (req: Request, res: Response) => {
    const target = req.params.target || 8000;
    const registrationId = req.get("x-registration-id");
    logger.info("request header 'x-registration-id'", registrationId);
    const targetUrl =
      `${prms.notificationRelayerBase}:${target}/notifications/${registrationId}`;

    setTimeout(async () => {
      logger.info("post notification at", targetUrl);
      const response = await fetch(targetUrl, {
        method: "POST",
      });
      const data = await response.text();
      logger.data("from relayer:", data);
    }, prms.delay);
    res.json({
      message: "will do it, do not worry",
    });
  };

const ack = (type: string, response?: any) =>
  (self as unknown as Worker).postMessage({
    type,
    message: "acknowledged",
    status: "ok",
    response,
  });

(self as unknown as Worker).onmessage = (evt: ICommandsServer) => {
  const cmdName = evt.data.command;
  const prms = { ...defaultParams, ...evt.data?.params };
  logger.info("received command", cmdName);
  if (cmdName === ECommandsServer.listen) {
    app.post("/longrunningstuff/:target", handlerFactory(prms));
    logger.info(
      "listening at",
      `\x1b[96;4mhttp://localhost:${prms.port}\x1b[0m`,
    );
    app.listen(prms.port);
    return ack(cmdName);
  }
  logger.error("command not available!");
};
