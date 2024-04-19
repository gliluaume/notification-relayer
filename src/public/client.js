const client = {
    registrationId: null,
    logon: () => {
        // Créer une connexion WebSocket
        const socket = new WebSocket("ws://localhost:8002");

        // La connexion est ouverte
        socket.addEventListener("open", function (event) {
            socket.send("Hello server!");
        });

        // Écouter les messages
        socket.addEventListener("message", (event) => {
            const message = JSON.parse(event.data);
            console.log("Message from socket:", message);
            if (message.type === 'registration') {
                client.registrationId = message.value
                socket.send("Registration done");
            }
        });
    }
}

window.gatewayClient = client;

