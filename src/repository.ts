import { Client } from "https://deno.land/x/postgres/mod.ts";

const client = new Client({
  user: "postgres",
  database: "notificationrelayer",
  hostname: "localhost",
  port: 5432,
  password: "mysecretpassword",
});
await client.connect();
let res = await client.queryArray(
  "INSERT INTO WebSocketServers VALUES('Server-001', 'http://localhost:8000', gen_random_uuid())"
);
console.log("WebSocketServers", res)
res = await client.queryArray(
  "select * from WebSocketServers;"
);
console.log("WebSocketServers", res)
res = await client.queryArray(
  "DELETE FROM WebSocketServers;"
);
console.log("WebSocketServers", res)
await client.end();
