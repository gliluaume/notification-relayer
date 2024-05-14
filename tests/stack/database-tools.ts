import { Client } from "https://deno.land/x/postgres/mod.ts";
import { IClientRegistration, IWSS } from "../../src/repository.ts";

const client = new Client({
  hostname: "localhost",
  port: 5432,
  user: "postgres",
  password: "mysecretpassword",
  database: "notificationrelayer",
  tls: { enabled: false },
});

const handleQuery = async <T>(query: string): Promise<T[]> => {
  await client.connect();
  const result = await client.queryObject(query);
  await client.end();
  return result.rows as T[];
};

export interface IRawRegistration {
  serverId: string;
  clientId: string;
  socketId: string;
}

export const getRegistrations = () =>
  handleQuery<IRawRegistration>(`
    SELECT
      serverId as "serverId",
      clientId as "clientId",
      socketId as "socketId"
    FROM relayer.registrations;
`);

export const getWebSocketServers = () =>
  handleQuery<IWSS>(`
    SELECT
      id,
      name,
      address,
      socketAddress AS "socketAddress"
    FROM relayer.websocketservers;
`);

interface INotifs {
  clientId: string;
  creationtime: string;
  link?: string;
  message?: string;
}
export const getPendingNotifications = () =>
  handleQuery<INotifs>(`
    SELECT
      clientId as "clientId",
      creationtime,
      link,
      message
    FROM relayer.pendingnotifications;
`);

export const reset = () =>
  handleQuery(`
    DELETE FROM relayer.pendingnotifications;
    DELETE FROM relayer.registrations;
    DELETE FROM relayer.WebSocketServers;
  `);
