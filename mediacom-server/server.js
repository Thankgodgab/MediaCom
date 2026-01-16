const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

// Discovery endpoint
app.get("/status", (req, res) => {
  const roomList = Array.from(rooms.entries()).map(([id, users]) => ({
    id,
    name: id, // For now room ID is the name
    userCount: users.size,
  }));
  res.json({ status: "ok", rooms: roomList });
});

// Store users by room
const rooms = new Map();

io.on("connection", (socket) => {
  console.log("Device connected:", socket.id);

  socket.on("join-room", ({ roomId, userName, role }) => {
    socket.join(roomId);

    const userData = {
      id: socket.id,
      name: userName || "Unknown User",
      role: role || "member",
    };

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }

    const roomUsers = rooms.get(roomId);
    roomUsers.set(socket.id, userData);

    console.log(
      `User ${userData.name} (${userData.role}) joined room ${roomId}`
    );

    // Notify others in the room
    socket.to(roomId).emit("user-joined", userData);

    // Send current users list to the new user
    socket.emit("room-users", Array.from(roomUsers.values()));

    socket.on("disconnect", () => {
      const roomUsers = rooms.get(roomId);
      if (roomUsers) {
        roomUsers.delete(socket.id);
        if (roomUsers.size === 0) {
          rooms.delete(roomId);
        }
      }
      socket.to(roomId).emit("user-left", socket.id);
      console.log("Device disconnected:", socket.id);
    });

    // Relay signaling messages
    socket.on("signal", (data) => {
      io.to(data.to).emit("signal", {
        from: socket.id,
        signal: data.signal,
      });
    });

    // Broadcast speaking status
    socket.on("speaking-status", ({ isSpeaking }) => {
      socket.to(roomId).emit("user-speaking", {
        id: socket.id,
        isSpeaking,
      });
    });
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("MediaCom Signaling Server running on port 3000");
});
