import { Commander } from "./commander.ts";
import { ECommandsServer, IParams } from "./commands-types.ts";

const backendApiCmdr = new Commander<ECommandsServer>(
  "backendApiCmdr",
  import.meta.resolve("./api.ts"),
);

const authApiCmdr = new Commander<ECommandsServer>(
  "authApiCmdr",
  import.meta.resolve("./auth-server.ts"),
);

// TODO: do not do that
export const sendTo = (name: string, cmd: ECommandsServer, params: IParams) => {
  const commander = name === "authApiCmdr" ? authApiCmdr : backendApiCmdr;
  return commander.postThenReceive(cmd, params);
};

export const startApis = () => {
  return [
    authApiCmdr.postThenReceive(ECommandsServer.listen, {
      port: 8005,
      mode: "success",
    }),
    backendApiCmdr.postThenReceive(ECommandsServer.listen),
  ];
};

export const stopApis = () => {
  return [authApiCmdr.stop(), backendApiCmdr.stop()];
};
