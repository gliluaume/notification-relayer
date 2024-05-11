import { ECommandsServer, ICommandsServer, IParams } from "./commands-types.ts";
import { getLogger } from "./get-logger.ts";

let port = Number(Deno.env.get("NRTEST_AUTH_PORT")) || 8005;
const modes = ["success", "error"];
type Mode = typeof modes[number];

const logger = getLogger("🗝️ ", "auth", {
  head: "color: yellow",
  highlight: "color: orange",
  error: "color: red; font-weight: bold",
});

// GET /users      // validate token status from service provider
const handler = (mode: Mode) => (request: Request): Response => {
  const url = new URL(request.url);
  const method = request.method.toLocaleLowerCase();
  if (url.pathname.toLowerCase() === "/users") {
    if (method !== "get") {
      return new Response(
        `Bad request: '${method}' not allowed`,
        {
          status: 405,
        },
      );
    }
    return mode === "success"
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
  const prms = evt.data?.params;
  logger.info("received command", cmdName);
  if (cmdName === ECommandsServer.listen) {
    port = Number(prms?.port || port);
    logger.info(
      "HTTP server running, listening at:",
      `http://localhost:${port}/`,
    );
    logger.info("mode:", prms!.mode.toString());
    // TODO fix types
    Deno.serve({ port }, handler(prms?.mode as unknown as Mode));
    return ack(cmdName);
  }
  logger.error("command not available!");
};
