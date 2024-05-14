import { ECommandsServer, ICommandsServer, IParams } from "./commands-types.ts";
import { getLogger } from "../get-logger.ts";

// let port = Number(Deno.env.get("NRTEST_AUTH_PORT")) || 8005;
const modes = ["success", "error"];
type Mode = typeof modes[number];

const logger = getLogger("🗝️", "auth", {
  head: "color: yellow",
  highlight: "color: orange",
  error: "color: red; font-weight: bold",
});

interface IAuthServerParams {
  mode: Mode;
  port: number;
}

let params: IAuthServerParams = {
  port: 8005,
  mode: "success",
};

// GET /users      // validate token status from service provider
const handler = (request: Request): Response => {
  const url = new URL(request.url);
  const method = request.method.toLocaleLowerCase();
  logger.info("received request", `${method} ${url}`);
  if (url.pathname.toLowerCase() === "/users") {
    if (method !== "get") {
      return new Response(
        `Bad request: '${method}' not allowed`,
        {
          status: 405,
        },
      );
    }
    return params.mode === "success"
      ? new Response("Authentication is valid", { status: 200 })
      : new Response("Unauthorized", { status: 403 });
  }
  return new Response("unknown path", { status: 404 });
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
  logger.info("received command", cmdName);

  if (cmdName === ECommandsServer.listen) {
    params = { ...params, ...evt.data?.params };
    logger.info(
      "HTTP server running, listening at:",
      `http://localhost:${params.port}/`,
    );
    logger.info("mode:", params.mode);
    // TODO fix types
    Deno.serve({ port: params.port }, handler);
    return ack(cmdName);
  }

  if (cmdName === ECommandsServer.setParams) {
    if (evt.data?.params?.port) {
      logger.log("param port ignored");
    }
    params = { ...params, ...evt.data?.params, ...{ port: params.port } };
    return ack(cmdName);
  }

  logger.error("command not available!");
};
