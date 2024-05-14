import { Commander } from "./commander.ts";
import { ECommandsWsBadClient, ECommandsWsClient } from "./commands-types.ts";
import { ECommandsServer } from "./commands-types.ts";

export const getBackendApiCmdr = () =>
  new Commander<ECommandsServer>(
    "backendApiCmdr",
    import.meta.resolve("./api.ts"),
  );

export const getAuthApiCmdr = () =>
  new Commander<ECommandsServer>(
    "authApiCmdr",
    import.meta.resolve("./auth-server.ts"),
  );

export const getWsClientCmdr = () =>
  new Commander<ECommandsWsClient>(
    "wsClientCmdr",
    import.meta.resolve("./client.ts"),
  );

export const getDirectWsCmdr = () =>
  new Commander<ECommandsWsBadClient>(
    "directWsCmdr",
    import.meta.resolve("./client-direct-ws.ts"),
  );
