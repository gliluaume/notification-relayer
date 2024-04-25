const client = {
  registrationId: () => localStorage.getItem("registrationId"),
  logon: async () => {
    const targetWssResponse = await fetch(
      "http://localhost:8000/socketAddress",
    );
    const targetWss = await targetWssResponse.json();
    // Créer une connexion WebSocket
    const socket = new WebSocket(targetWss.socketAddress);
    // TODO send registrationId
    socket.addEventListener("open", function (event) {
      // Send registration id if not null
      socket.send("Hello server!");
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      console.log("Message from socket:", message);
      if (message.type === "registration") {
        localStorage.setItem("registrationId", message.value);
        client.registrationId = message.value;
        socket.send("Registration done");
      }
    });

    socket.addEventListener("close", (e) => {
      console.log(
        "Socket is closed. Reconnect will be attempted in 1 second.",
        e.reason,
      );
      setTimeout(client.logon, 1000);
    });
  },
};

window.gatewayClient = client;
