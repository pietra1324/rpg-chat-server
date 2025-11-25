import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

let rooms = {}; // salas

wss.on("connection", (ws) => {
  ws.room = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.action === "createRoom") {
        const id = Math.random().toString(36).substring(2, 7);
        rooms[id] = [];
        ws.room = id;
        rooms[id].push(ws);

        ws.send(JSON.stringify({ action: "roomCreated", room: id }));
      }

      if (data.action === "joinRoom") {
        const id = data.room;

        if (!rooms[id]) {
          ws.send(JSON.stringify({ action: "error", msg: "Sala não existe" }));
          return;
        }

        ws.room = id;
        rooms[id].push(ws);

        ws.send(JSON.stringify({ action: "joinedRoom", room: id }));
      }

      if (data.action === "message") {
        if (!ws.room) return;

        rooms[ws.room].forEach((client) => {
          if (client.readyState === client.OPEN) {
            client.send(
              JSON.stringify({
                action: "message",
                user: data.user,
                text: data.text,
                role: data.role
              })
            );
          }
        });
      }
    } catch (err) {
      console.log("Erro:", err);
    }
  });

  ws.on("close", () => {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter((c) => c !== ws);
      if (rooms[ws.room].length === 0) delete rooms[ws.room];
    }
  });
});

console.log("Servidor WebSocket rodando na porta " + PORT);
