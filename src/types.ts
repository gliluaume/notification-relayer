export interface ISessions {
    socketId: string;
    clientIp: string;
}

export type messageTypes = 'registration' | 'ping' | 'notification';
export interface IMessage {
    type: messageTypes;
    value: any;
}

export type MyWebSocket = WebSocket & {
    id: string;
}