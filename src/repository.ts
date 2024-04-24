import { Client, QueryObjectResult } from "https://deno.land/x/postgres/mod.ts";

const client = new Client({
  hostname: Deno.env.get("DB_HOST") || "localhost",
  port: Deno.env.get("DB_PORT") || 5432,
  user: Deno.env.get("DB_USER") || "postgres",
  password: Deno.env.get("DB_PWD") || "mysecretpassword",
  database: "notificationrelayer",
});

export interface IWSS {
  name: string;
  address: string;
  socketAddress: string;
}
export interface IPendingNotification {
  clientId: string;
  creationTime: Date;
  message: string;
}

type reqFn = (query: string) => any;

const handleSingleResultQuery = async (query: string) => {
  await client.connect();
  const result = await client.queryObject(query);
  await client.end();
  return result.rows[0];
};
/* refacto connection handling

export const addServer = async (server: IWSS) => handleQueryObject(`
  INSERT INTO relayer.WebSocketServers(id, name, address, socketAddress)
  VALUES(gen_random_uuid(), '${server.name}', '${server.address}', '${server.socketAddress}')
  ON CONFLICT DO NOTHING
  RETURNING id
`);
*/

export const addServer = async (server: IWSS) => {
  await client.connect();
  await client.queryObject(
    `INSERT INTO relayer.WebSocketServers(id, name, address, socketAddress)
    VALUES(gen_random_uuid(), '${server.name}', '${server.address}', '${server.socketAddress}')
    ON CONFLICT DO NOTHING
    RETURNING id`,
  );
  await client.end();
};

export const removeServer = async (serverName: string) => {
  await client.connect();
  await client.queryArray(
    `DELETE FROM relayer.WebSocketServers WHERE name = '${serverName}';`,
  );
  await client.end();
};

export const addClientRegistration = async (serverName: string) => {
  await client.connect();
  const res = await client.queryObject(
    `INSERT INTO relayer.Registrations(serverId, clientId)
    SELECT srv.id, gen_random_uuid()
    FROM relayer.WebSocketServers AS srv
    WHERE name = '${serverName}'
    RETURNING clientId;`,
  );
  await client.end();
  return (res as any).rows[0].clientid;
};

export const getClientRegistration = async (clientId: string) => {
  await client.connect();
  const res = await client.queryObject(
    `SELECT serverId, clientId
    FROM relayer.Registrations
    WHERE clientId = '${clientId}';`,
  );
  await client.end();
  console.log(res);
  return res;
};

export const removeClientRegistration = async (clientId: string) => {
  await client.connect();
  await client.queryArray(
    `DELETE FROM relayer.Registrations
    WHERE clientId = '${clientId}'`,
  );
  await client.end();
};

export const addNotification = async (clientId: string) => {
  await client.connect();
  await client.queryArray(
    `INSERT INTO relayer.PendingNotifications (clientId)
    VALUES ('${clientId}')`,
  );
  await client.end();
};

export const getWssHavingFewestConnectedClients = () =>
  handleSingleResultQuery(`
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

// export const getWssHavingFewestConnectedClients = async () => {
//   await client.connect();
//   await client.queryArray(`
//     SELECT wss.*, count(*) AS numOfConn
//     FROM Relayer.Registrations reg
//     INNER JOIN Relayer.WebSocketServers wss ON reg.serverId = wss.id
//     GROUP BY wss.id
//     ORDER BY numOfConn ASC
//     FETCH FIRST 1 ROWS ONLY
//   `);
//   await client.end();
// }

/*
export const getPendingNotifications = async (registrationId: string): Promise<IPendingNotification[]> => Promise.resolve([]);
export const addPendingNotification = async (registrationId: string, message?: string): Promise<void> => Promise.resolve();
export const delServer = async (server: IWSS) => {};
export const getServerFromRegistrationId = async (registrationId: string): Promise<IWSS> => Promise.resolve({});
*/
