import { Client } from "https://deno.land/x/postgres/mod.ts";

const client = new Client({
  user: "postgres",
  database: "notificationrelayer",
  hostname: "localhost",
  port: 5432,
  password: "mysecretpassword",
});

export interface IWSS {
  name: string;
  address: string;
}
export interface IPendingNotification {
  clientId: string;
  creationTime: Date;
  message: string;
}

export const addServer = async (server: IWSS) => {
  await client.connect();
  await client.queryArray(
    `INSERT INTO relayer.WebSocketServers(id, name, address) VALUES(gen_random_uuid(), '${server.name}', '${server.address}')`,
  );
  const res = await  client.queryArray(
    `SELECT id FROM relayer.WebSocketServers WHERE name = '${server.name}'`,
  );
  await client.end();
  return res.rows[0];
};

export const removeServer = async (serverName: string) => {
  await client.connect();
  await client.queryArray(
    `DELETE FROM relayer.WebSocketServers WHERE name = '${serverName}'`,
  );
  await client.end();
};

/*
export const getPendingNotifications = async (registrationId: string): Promise<IPendingNotification[]> => Promise.resolve([]);
export const addPendingNotification = async (registrationId: string, message?: string): Promise<void> => Promise.resolve();
export const delServer = async (server: IWSS) => {};
export const getServerFromRegistrationId = async (registrationId: string): Promise<IWSS> => Promise.resolve({});
*/