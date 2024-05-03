import { delay } from "https://deno.land/std@0.224.0/async/delay.ts";
import { assert, assertEquals } from "jsr:@std/assert";
import { getRegistrations, getWebSocketServers } from "./database-tools.ts";
import { setup, tearDown } from "./docker-tools.ts";
import { getLogger } from "./get-logger.ts";
import { Commander } from "./client-commander.ts";
// import { startApi, stopApi } from "./api-tools.ts";
import { ECommands } from "./client-types.ts";

const serverDomain = "localhost:8000";

const logger = getLogger("🧪", "test", {
  head: "color: limegreen",
});

Deno.test("Testing the stack", async (t) => {
  const startStack = await setup();
  // const api = await startApi();
  logger.info("start");

  await t.step("health and registrations", async () => {
    let wss = await getWebSocketServers();
    assertEquals(wss, []);

    const response = await fetch(`http://${serverDomain}/health`);
    const body = await response.json();
    assertEquals(body, {
      isRegistred: true,
      numConnections: 0,
      name: "wss-01",
      address: "http://relayer-wss-1",
      socketAddress: `ws://${serverDomain}`,
    });
    wss = await getWebSocketServers();

    assertEquals(wss.length, 1);
    assertEquals(wss[0].id.length, 36);
    assertEquals(wss[0].name, "wss-01");
    assertEquals(wss[0].address, "http://relayer-wss-1");
    assertEquals(wss[0].socketAddress, `ws://${serverDomain}`);
  });

  await t.step("logon then logout client", async () => {
    const commander = new Commander("cmdr");
    await commander.postThenReceive(ECommands.setup);

    await commander.postThenReceive(ECommands.logon);
    await delay(50);
    let registrations = await getRegistrations();
    assertEquals(registrations.length, 1);
    assertEquals(registrations[0].socketId.length, 24);
    assert(registrations[0].socketId.endsWith("="));
    assertEquals(registrations[0].clientId.length, 36);
    assertEquals(registrations[0].serverId.length, 36);

    await commander.postThenReceive(ECommands.logout);
    await delay(50);
    registrations = await getRegistrations();
    assertEquals(registrations.length, 0);
  });

  logger.info("end");
  await tearDown(startStack);
  // await stopApi(api);
});
