import { delay } from "https://deno.land/std@0.224.0/async/delay.ts";
import { assertEquals } from "jsr:@std/assert";
import { getWebSocketServers } from "./database-tools.ts";
import { setup, tearDown } from "./docker-tools.ts";

const serverDomain = "localhost:8000";

Deno.test("Testing the stack", async (t) => {
  const startStack = await setup();
  console.log("%c\n🧪 start tests", "color: cyan");

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

    assertEquals(wss[0][0].length, 36);
    assertEquals(wss[0][1], "wss-01");
    assertEquals(wss[0][2], "http://relayer-wss-1");
    assertEquals(wss[0][3], `ws://${serverDomain}`);
  });

  console.log("%c\n🧪 start tests", "color: cyan");
  await tearDown(startStack);
});
