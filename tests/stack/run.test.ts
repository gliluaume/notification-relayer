import { delay } from "https://deno.land/std@0.224.0/async/delay.ts";
import { assert, assertEquals } from "jsr:@std/assert";
import {
  getPendingNotifications,
  getRegistrations,
  getWebSocketServers,
} from "./database-tools.ts";
import { setup, tearDown } from "./docker-tools.ts";
import { getLogger } from "./get-logger.ts";
import { Commander } from "./client-commander.ts";
import { startApi, stopApi } from "./api-tools.ts";
import { ECommands } from "./client-types.ts";

const serverDomain = "localhost:8000";

const logger = getLogger("🧪", "test", {
  head: "color: limegreen",
});

const fetchJson = async (path: string) =>
  (await fetch(`http://${serverDomain}${path}`)).json();

Deno.test("Testing the stack", async (t) => {
  const api = await startApi();
  const startStack = await setup();
  logger.info("start");

  await t.step("health and registrations", async () => {
    let wss = await getWebSocketServers();
    assertEquals(wss, []);

    const body = await fetchJson("/health");
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
    // FIXME Should not have to wait
    await delay(50);
    let health = await fetchJson("/health");
    assertEquals(health.numConnections, 1);
    let registrations = await getRegistrations();
    assertEquals(registrations.length, 1);
    assertEquals(registrations[0].socketId.length, 24);
    assert(registrations[0].socketId.endsWith("="));
    assertEquals(registrations[0].clientId.length, 36);
    assertEquals(registrations[0].serverId.length, 36);

    await commander.postThenReceive(ECommands.logout);
    // FIXME Should not have to wait
    await delay(50);
    health = await fetchJson("/health");
    assertEquals(health.numConnections, 0);
    registrations = await getRegistrations();
    assertEquals(registrations.length, 0);
  });

  await t.step("logon then call API client", async () => {
    const commander = new Commander("cmdr");
    await commander.postThenReceive(ECommands.setup);

    await commander.postThenReceive(ECommands.logon);
    // await delay(50);
    let health = await fetchJson("/health");
    assertEquals(health.numConnections, 1);

    await commander.postThenReceive(ECommands.callA);
    // FIXME Should not have to wait
    await delay(1500);
    const notifs = await getPendingNotifications();
    assertEquals(notifs.length, 1);
    assertEquals(notifs[0].clientId.length, 36);

    await commander.postThenReceive(ECommands.logout);
    // FIXME Should not have to wait
    await delay(500);
    health = await fetchJson("/health");
    assertEquals(health.numConnections, 0);
  });

  logger.info("end");
  await tearDown(startStack);
  await stopApi(api);
});
