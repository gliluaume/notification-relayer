import { JSONFilePreset  } from "npm:lowdb@7.0.1/node";
import { v4 as uuidv4} from "npm:uuid@9.0.1"

/*
    WSS table
    - id: string, the server id, primary key
    - address: string, the server's url

    REGISTRATIONS table
    - clientId: UUID, id of the client / registration, primary key
    - serverId: string, name of the server instance

    PENDING_NOTIFICATIONS table
    - clientId: UUID, unique
*/

export type Uuid = uuidv4

export type WebSocketServer = {
    id: string; // unique
    address: string;
}

export type Registrations = {
    clientId: Uuid; // unique
    serverId: string;
}

export type PendingNotifications = {
    clientId: Uuid; // not unique
    message?: string;
}


type Data = {
    webSocketServer: WebSocketServer[];
    registrations: Registrations[];
    pendingNotifications: PendingNotifications[];
}

const defaultData: Data = { messages: [] }
const db = await JSONFilePreset<Data>('db.json', defaultData)


