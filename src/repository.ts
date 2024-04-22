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

/**/
export interface IWSS {
  id: string;
  address: string;
  clientId: string;
}
export interface IPendingNotification {
  clientId: string;
  creationTime: Date;
  message: string;
}
/*
export const getPendingNotifications = async (registrationId: string): Promise<IPendingNotification[]> => Promise.resolve([]);
export const addPendingNotification = async (registrationId: string, message?: string): Promise<void> => Promise.resolve();
export const addServer = async (server: IWSS) => {};
export const delServer = async (server: IWSS) => {};
export const getServerFromRegistrationId = async (registrationId: string): Promise<IWSS> => Promise.resolve({});
*/