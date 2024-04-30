import { Client } from "https://deno.land/x/postgres/mod.ts";

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
  const result = await client.queryArray(query);
  await client.end();
  return result.rows as T[];
};

export const getRegistrations = () =>
  handleQuery(`
    SELECT * FROM relayer.registrations;
`);

export const getWebSocketServers = () =>
  handleQuery<string[]>(`
    SELECT * FROM relayer.websocketservers;
`);

export const getPendingNotifications = () =>
  handleQuery(`
    SELECT * FROM relayer.pendingnotifications;
`);
