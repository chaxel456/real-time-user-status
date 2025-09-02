// server.js
// Real-Time User Status Indicator - Node.js + Express + Socket.IO
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serves /public for quick manual testing

// ---- In-memory user store ----
// Pre-seed a few demo users (you can change these)
const initialUsers = [
  { id: "1", name: "John Doe" },
  { id: "2", name: "Jane Smith" },
  { id: "3", name: "Alice Brown" },
  { id: "4", name: "Bob Green" }
];

// Map of userId -> { id, name, status, connections }
const users = new Map(
  initialUsers.map(u => [u.id, { ...u, status: "offline", connections: 0 }])
);

// Map socket.id -> userId to resolve user on disconnect
const socketToUser = new Map();

// REST: GET /users - return all users and their current statuses
app.get("/users", (req, res) => {
  const list = Array.from(users.values()).map(u => ({
    id: u.id,
    name: u.name,
    status: u.status
  }));
  res.json(list);
});

// Simple healthcheck
app.get("/health", (_req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Socket.IO real-time handling
io.on("connection", (socket) => {
  // Expect the client to pass userId (and optionally name) via auth
  const { userId, name } = socket.handshake.auth || {};
  if (!userId) {
    socket.emit("errorMessage", "Missing userId in socket auth. Example: io('/', { auth: { userId: '1' } })");
    // Disconnect to enforce contract (could also allow anonymous connections)
    socket.disconnect(true);
    return;
  }

  // Create or load user
  let user = users.get(String(userId));
  if (!user) {
    // If a new user connects and wasn't pre-seeded, we can add them on the fly
    const displayName = name || `User ${userId}`;
    user = { id: String(userId), name: displayName, status: "offline", connections: 0 };
    users.set(String(userId), user);
  } else if (name && user.name !== name) {
    // Optional: update name if provided
    user.name = name;
  }

  // Track connection
  user.connections += 1;
  socketToUser.set(socket.id, user.id);

  const wasOffline = user.status !== "online";
  user.status = "online";

  // Send the full user list to the just-connected client
  socket.emit("users", Array.from(users.values()).map(u => ({
    id: u.id, name: u.name, status: u.status
  })));

  // Broadcast that this user went online (only if status actually changed)
  if (wasOffline) {
    io.emit("statusUpdate", { id: user.id, status: "online" });
  }

  // Optional: allow client to change their display name later
  socket.on("setName", (newName) => {
    const uid = socketToUser.get(socket.id);
    if (!uid) return;
    const u = users.get(uid);
    if (!u) return;
    u.name = String(newName || u.name);
    io.emit("userUpdated", { id: u.id, name: u.name });
  });

  socket.on("disconnect", () => {
    const uid = socketToUser.get(socket.id);
    socketToUser.delete(socket.id);
    if (!uid) return;
    const u = users.get(uid);
    if (!u) return;

    u.connections = Math.max(0, u.connections - 1);
    if (u.connections === 0) {
      const wasOnline = u.status === "online";
      u.status = "offline";
      if (wasOnline) {
        io.emit("statusUpdate", { id: u.id, status: "offline" });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`REST: GET http://localhost:${PORT}/users`);
});
