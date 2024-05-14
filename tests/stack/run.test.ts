import { delay } from "https://deno.land/std@0.224.0/async/delay.ts";
import { assert, assertEquals } from "jsr:@std/assert";
import * as db from "./database-tools.ts";
import { setup, tearDown } from "./docker-tools.ts";
import { getLogger } from "./get-logger.ts";
import {
  ECommandsServer,
  ECommandsWsBadClient,
  ECommandsWsClient,
} from "./commands-types.ts";
import {
  getAuthApiCmdr,
  getBackendApiCmdr,
  getDirectWsCmdr,
  getWsClientCmdr,
} from "./commanders.ts";

const serverDomain = "localhost:8000";

const logger = getLogger("🧪", "test", {
  head: "color: limegreen",
});

const fetchJson = async (path: string) =>
  (await fetch(`http://${serverDomain}${path}`)).json();

Deno.test("Testing the stack", async (t) => {
  const backendApiCmdr = getBackendApiCmdr();
  const authApiCmdr = getAuthApiCmdr();
  logger.info("start");
  const [startStack] = await Promise.all([
    setup(true),
    backendApiCmdr.postThenReceive(ECommandsServer.listen),
    authApiCmdr.postThenReceive(ECommandsServer.listen),
  ]);

  await t.step("health and registrations", async () => {
    let wss = await db.getWebSocketServers();
    assertEquals(wss, []);

    const body = await fetchJson("/health");
    assertEquals(body, {
      isRegistred: true,
      numConnections: 0,
      name: "wss-01",
      address: "http://relayer-wss-1",
      socketAddress: `ws://${serverDomain}`,
    });
    wss = await db.getWebSocketServers();

    assertEquals(wss.length, 1);
    assertEquals(wss[0]?.id?.length, 36);
    assertEquals(wss[0].name, "wss-01");
    assertEquals(wss[0].address, "http://relayer-wss-1");
    assertEquals(wss[0].socketAddress, `ws://${serverDomain}`);
  });

  await t.step("logon then logout client", async () => {
    const wsClientCmdr = getWsClientCmdr();
    await wsClientCmdr.postThenReceive(ECommandsWsClient.setup);

    await wsClientCmdr.postThenReceive(ECommandsWsClient.logon);
    let health = await fetchJson("/health");
    assertEquals(health.numConnections, 1);
    // FIXME Should not have to wait
    await delay(50);
    let registrations = await db.getRegistrations();
    assertEquals(registrations.length, 1);
    assertEquals(registrations[0].socketId.length, 24);
    assert(registrations[0].socketId.endsWith("="));
    assertEquals(registrations[0].clientId.length, 36);
    assertEquals(registrations[0].serverId.length, 36);

    await wsClientCmdr.postThenReceive(ECommandsWsClient.logout);
    // FIXME Should not have to wait
    await delay(50);
    health = await fetchJson("/health");
    assertEquals(health.numConnections, 0);
    registrations = await db.getRegistrations();
    assertEquals(registrations.length, 0);
  });

  await t.step("logon then call backend API", async () => {
    const wsClientCmdr = getWsClientCmdr();
    await wsClientCmdr.postThenReceive(ECommandsWsClient.setup);
    await wsClientCmdr.postThenReceive(ECommandsWsClient.logon);

    let health = await fetchJson("/health");
    assertEquals(health.numConnections, 1);

    await wsClientCmdr.postThenReceive(ECommandsWsClient.callA);
    // FIXME Should not have to wait
    await delay(500);
    const notifs = await db.getPendingNotifications();
    assertEquals(notifs.length, 1);
    assertEquals(notifs[0].clientId.length, 36);

    let history = await wsClientCmdr.postThenReceive(
      ECommandsWsClient.getHistory,
    );
    assertEquals(history.response.length, 2);
    assert(/you have got a message/.exec(history.response[1].data));

    await wsClientCmdr.postThenReceive(ECommandsWsClient.callB);
    // FIXME Should not have to wait
    await delay(1500);
    history = await wsClientCmdr.postThenReceive(ECommandsWsClient.getHistory);
    assertEquals(history.response.length, 3);
    assert(/you have got a message/.exec(history.response[2].data));

    await wsClientCmdr.postThenReceive(ECommandsWsClient.logout);
    // FIXME Should not have to wait
    await delay(500);
    health = await fetchJson("/health");
    assertEquals(health.numConnections, 0);
  });

  // TODO isolate this step in another test
  await t.step("reject non authorized connection", async () => {
    await authApiCmdr.postThenReceive(ECommandsServer.setParams, {
      mode: "error",
    });
    const wsClientCmdr = getWsClientCmdr();
    await wsClientCmdr.postThenReceive(ECommandsWsClient.setup);
    const logResult = await wsClientCmdr.postThenReceive(
      ECommandsWsClient.logon,
    );
    assertEquals(logResult.status, "exception");
    assert(
      /Request failed with status 401/.exec(logResult.response.toString()),
    );
    await authApiCmdr.postThenReceive(ECommandsServer.setParams, {
      mode: "success",
    });
  });

  await t.step("reject direct web socket", async () => {
    await authApiCmdr.postThenReceive(ECommandsServer.setParams, {
      mode: "error",
    });

    const directWsCmdr = getDirectWsCmdr();

    let result = await directWsCmdr.postThenReceive(
      ECommandsWsBadClient.openRawNoUuid,
    );
    result = await directWsCmdr.postThenReceive(ECommandsWsBadClient.send);
    assertEquals(result.message, "readyState not OPEN");
    assertEquals(result.status, "exception");
    let health = await fetchJson("/health");
    assertEquals(health.numConnections, 0);

    result = await directWsCmdr.postThenReceive(
      ECommandsWsBadClient.openRawWithUuid,
    );
    result = await directWsCmdr.postThenReceive(ECommandsWsBadClient.send);
    assertEquals(result.message, "readyState not OPEN");
    assertEquals(result.status, "exception");
    health = await fetchJson("/health");
    assertEquals(health.numConnections, 0);

    await authApiCmdr.postThenReceive(ECommandsServer.setParams, {
      mode: "success",
    });
  });

  await Promise.all([
    authApiCmdr.stop(),
    backendApiCmdr.stop(),
    tearDown(startStack),
  ]);
  logger.info("end");
});
