const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";

const client = {
  READY_STATES: {
    CONNECTING: 0, // Socket has been created. The connection is not yet open.
    OPEN: 1, // The connection is open and ready to communicate.
    CLOSING: 2, // The connection is in the process of closing.
    CLOSED: 3, // The connection is closed or couldn't be opened.
  },
  log: console.log,
  clearRegistrationId: () => localStorage.removeItem("registrationId"),
  registrationId: () => localStorage.getItem("registrationId") || EMPTY_UUID,
  socket: null,
  retryHandle: null,
  logon: async () => {
    client.log("log on in progress");
    client.retry = true;
    if (
      [client.READY_STATES.CONNECTING, client.READY_STATES.OPEN].includes(
        client.socket?.readyState,
      )
    ) {
      client.log("already logged in or loging in progress", client.socket);
      return;
    }

    const targetWssResponse = await fetch(
      `http://localhost:8000/socketAddresses/${client.registrationId()}`,
      {
        method: "POST",
        mode: "cors",
        headers: {
          "x-token": "test",
        },
      },
    );

    if (targetWssResponse.status === 404) {
      client.clearRegistrationId();
      await client.logon();
    }

    const targetWss = await targetWssResponse.json();
    client.log("target", targetWss);
    localStorage.setItem("registrationId", targetWss.registrationId);

    // Créer une connexion WebSocket
    client.socket = new WebSocket(
      targetWss.socketAddress,
      targetWss.registrationId,
    );

    // TODO send registrationId
    client.socket.addEventListener("open", function (event) {
      // Send registration id if not null
      client.log("will send something");
      client.socket.send("Hello server");
    });

    client.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      client.log("Message from socket:", message);
    });

    client.socket.addEventListener("close", client.onCloseListener);
  },
  onCloseListener: (e) => {
    client.log("Socket is closed.", e);
    if (client.retry) {
      client.log("Reconnect will be attempted in 1 second.");
      // TODO: set interval
      retryHandle = setTimeout(client.logon, 1000);
    }
  },
  retry: true,
  logout: () => {
    client.clearRegistrationId();
    client.socket.removeEventListener("close", client.onCloseListener);
    client.retry = false;
    client.socket.onclose = () => {}; // disable onclose handler first
    client.socket.close();
  },
};

globalThis.gatewayClient = client;
