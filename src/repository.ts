import { Pool } from "https://deno.land/x/postgres/mod.ts";

const POOL_CONNECTIONS = 20;
const POOL_LAZY = true;
const dbPool = new Pool(
  {
    hostname: Deno.env.get("DB_HOST") || "localhost",
    port: Deno.env.get("DB_PORT") || 5432,
    user: Deno.env.get("DB_USER") || "postgres",
    password: Deno.env.get("DB_PWD") || "mysecretpassword",
    database: "notificationrelayer",
    tls: { enabled: false },
  },
  POOL_CONNECTIONS,
  POOL_LAZY,
);

export interface IWSS {
  id?: string;
  name: string;
  address: string;
  socketAddress: string;
}
export interface IPendingNotification {
  clientId: string;
  creationTime: Date;
  message: string;
}

const handleSingleResultQuery = async <T>(query: string): Promise<T> => {
  using client = await dbPool.connect();
  // console.log(query);
  await client.connect();
  const result = await client.queryObject(query);
  await client.end();
  return result.rows[0] as T;
};

export const addServer = (server: IWSS) =>
  handleSingleResultQuery(`
  INSERT INTO relayer.WebSocketServers(id, name, address, socketAddress)
  VALUES(gen_random_uuid(), '${server.name}', '${server.address}', '${server.socketAddress}')
  ON CONFLICT DO NOTHING
  RETURNING id
`);

export const removeServer = (serverName: string) =>
  handleSingleResultQuery(`
  DELETE FROM relayer.WebSocketServers WHERE name = '${serverName}'
`);

export interface IAddRegistrationResult {
  clientid: string;
}

export const addClientRegistration = (serverName: string) =>
  handleSingleResultQuery<IAddRegistrationResult>(`
  INSERT INTO relayer.Registrations(serverId, clientId)
  SELECT srv.id, gen_random_uuid()
  FROM relayer.WebSocketServers AS srv
  WHERE name = '${serverName}'
  RETURNING clientId
`);

export interface IClientRegistration {
  serverId: string;
  address: string;
  clientId: string;
}

export const patchClientRegistration = (clientId: string, socketId: string) =>
  handleSingleResultQuery<IClientRegistration>(`
  UPDATE relayer.Registrations
  SET socketId = '${socketId}'
  WHERE clientId = '${clientId}'
`);

export const getClientRegistration = (clientId: string) =>
  handleSingleResultQuery<IClientRegistration>(`
  SELECT reg.serverId, wss.address, reg.clientId as "clientId"
  FROM relayer.Registrations reg
  INNER JOIN relayer.WebSocketServers wss ON wss.id = reg.serverId
  WHERE clientId = '${clientId}'
`);

export const removeClientRegistration = (clientId: string) =>
  handleSingleResultQuery(`
  DELETE FROM relayer.Registrations
  WHERE clientId = '${clientId}'
`);

export const addNotification = (clientId: string) =>
  handleSingleResultQuery(`
  INSERT INTO relayer.PendingNotifications (clientId)
  VALUES ('${clientId}')
`);

export interface IRegistration {
  registrationId: string | null;
  name: string;
  address: string;
  socketAddress: string;
}

export const getWssHavingFewestConnectedClients = () =>
  handleSingleResultQuery<IRegistration>(`
  SELECT name, address, socketAddress AS "socketAddress" FROM (
    SELECT
      wss.*,
      COALESCE(CAST(count(reg.clientId) AS INTEGER), 0) AS numOfConn
    FROM Relayer.WebSocketServers wss
    LEFT OUTER JOIN Relayer.Registrations reg ON reg.serverId = wss.id
    GROUP BY wss.id
    ORDER BY numOfConn ASC
    FETCH FIRST 1 ROWS ONLY
  )
`);
