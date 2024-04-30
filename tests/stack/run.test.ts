import { assertEquals } from "jsr:@std/assert";

import { getWebSocketServers } from "./database-tools.ts";
import { setup, tearDown } from "./docker-tools.ts";

Deno.test("Testing the stack", async (t) => {
  const startStack = await setup();
  console.log("%c\n🧪 start tests", "color: cyan");

  await t.step("health and regstrations", async () => {
    let wss = await getWebSocketServers();
    assertEquals(wss, []);

    const response = await fetch("http://localhost:8000/health");
    const body = await response.json();
    assertEquals(body, {
      isRegistred: true,
      numConnections: 0,
      name: "wss-01",
      address: "http://relayer-wss-1",
      socketAddress: "ws://localhost:8000",
    });
    wss = await getWebSocketServers();

    assertEquals(wss[0][0].length, 36);
    assertEquals(wss[0][1], "wss-01");
    assertEquals(wss[0][2], "http://relayer-wss-1");
    assertEquals(wss[0][3], "ws://localhost:8000");
  });

  console.log("%c\n🧪 start tests", "color: cyan");
  await tearDown(startStack);
});
