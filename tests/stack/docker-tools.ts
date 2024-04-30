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

export const setup = async () => {
  console.log("%c🐳 delete containers", "color: magenta");
  const delContainer = cmdDeleteContainer.spawn();
  delContainer.ref;
  await delContainer.status;

  console.log("%c🐳 delete images", "color: magenta");
  const delImages = cmdDeleteImages.spawn();
  delImages.ref;
  await delImages.status;

  console.log("%c🐋 build stack", "color: magenta");
  const buildStack = cmdBuildStack.spawn();
  buildStack.ref();
  await buildStack.status;

  console.log("%c🐋 starting up stack", "color: magenta");
  const startStack = cmdStartStack.spawn();
  startStack.ref();
  await new Promise((resolve) => setTimeout(() => resolve(true), 5000));

  return startStack;
};

export const tearDown = async (startStack: Deno.ChildProcess) => {
  console.log("%c🐋 stopping down stack", "color: magenta");
  const stopStack = cmdStopStack.spawn();
  startStack.ref();
  await startStack.status;
  await stopStack.status;
};
