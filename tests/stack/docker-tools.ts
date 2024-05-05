import { getLogger } from "./get-logger.ts";

const composeFile = import.meta.dirname + "/../../docker-compose.yml";

export const cmdDeleteImages = new Deno.Command("docker", {
  args: [
    "rmi",
    "test-relayer-relayer-database",
    "test-relayer-relayer-wss-1",
    "test-relayer-relayer-wss-2",
  ],
});

export const cmdDeleteContainer = new Deno.Command("docker", {
  args: [
    "rm",
    "-f",
    "relayer-database",
    "relayer-wss-1",
    "relayer-wss-2",
  ],
});

export const cmdBuildStack = new Deno.Command("docker-compose", {
  args: [
    "--project-name",
    "test-relayer",
    "--file",
    composeFile,
    "build",
    "relayer-database",
    "relayer-wss-1",
    "relayer-wss-2",
  ],
});

export const cmdStartStack = new Deno.Command("docker-compose", {
  args: [
    "--project-name",
    "test-relayer",
    "--file",
    composeFile,
    "up",
    "relayer-database",
    "relayer-wss-1",
    "relayer-wss-2",
  ],
});

export const cmdStopStack = new Deno.Command("docker-compose", {
  args: [
    "--project-name",
    "test-relayer",
    "--file",
    composeFile,
    "stop",
    "relayer-database",
    "relayer-wss-1",
    "relayer-wss-2",
  ],
});

const logger = getLogger("🐳", "stack", {
  head: "color: cornflowerblue",
});

export const setup = async (reset = false) => {
  logger.info("stop containers");
  const delContainer = cmdDeleteContainer.spawn();
  delContainer.ref;
  await delContainer.status;

  if (reset) {
    logger.info("delete image");
    const delImages = cmdDeleteImages.spawn();
    delImages.ref;
    await delImages.status;

    logger.info("build stack");
    const buildStack = cmdBuildStack.spawn();
    buildStack.ref();
    await buildStack.status;
  }

  logger.info("starting up stack");
  const startStack = cmdStartStack.spawn();
  startStack.ref();
  await new Promise((resolve) => setTimeout(() => resolve(true), 5000));

  return startStack;
};

export const tearDown = async (startStack: Deno.ChildProcess) => {
  logger.info("stopping stack");
  const stopStack = cmdStopStack.spawn();
  startStack.ref();
  await startStack.status;
  await stopStack.status;
};
