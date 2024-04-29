READY_STATES = {
  CONNECTING: 0, // Socket has been created. The connection is not yet open.
  OPEN: 1, // The connection is open and ready to communicate.
  CLOSING: 2, // The connection is in the process of closing.
  CLOSED: 3, // The connection is closed or couldn't be opened.
};

const client = {
  registrationId: () => localStorage.getItem("registrationId"),
  socket: null,
  retryHandle: null,
  logon: async () => {
    console.log("log on in progress");
    client.retry = true;
    if ([READY_STATES.CONNECTING, READY_STATES.OPEN].includes(client.socket?.readyState)) {
      console.log("already logged in or loging in progress", client.socket)
      return;
    }

    const targetWssResponse = await fetch(
      "http://localhost:8000/socketAddress",
    );
    const targetWss = await targetWssResponse.json();
    // Créer une connexion WebSocket
    client.socket = new WebSocket(targetWss.socketAddress);
    // TODO send registrationId
    client.socket.addEventListener("open", function (event) {
      // Send registration id if not null
      console.log("will send something")
      client.socket.send("Hello server");
      if (client.registrationId()) {
        client.socket.send(`declare-registration-id ${client.registrationId()}`);
      } else {
        console.log("no registration id");
        client.socket.send("get-registration-id");
      }
    });

    client.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      console.log("Message from socket:", message);
      if (message.type === "registration") {
        localStorage.setItem("registrationId", message.value);
        console.log("registrationId", message.value)
        client.socket.send(JSON.stringify({message :"Registration done"}));
      }
    });

    client.socket.addEventListener("close", client.onCloseListener);
  },
  onCloseListener: (e) => {
    console.log("Socket is closed.", e);
    if (client.retry) {
      console.log("Reconnect will be attempted in 1 second.");
      // TODO: set interval
      retryHandle = setTimeout(client.logon, 1000);
    }
  },
  retry: true,
  logout: () => {
    // client.socket.removeEventListener("close", client.onCloseListener);
    client.retry = false;
    client.socket.onclose = () => { }; // disable onclose handler first
    client.socket.close();
  }
};

window.gatewayClient = client;
