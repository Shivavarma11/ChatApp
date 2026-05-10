import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import { Socket } from "dgram";

//Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: "*" }
})


export const userSocketMap = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    if (userId) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  })
})
//Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Health-check and root handlers
app.get('/api/status', (req, res) => res.send("Server is live"));
app.get('/', (req, res) => res.send('Server is live - API available at /api'));

// Favicon handlers to avoid 404 noise from platforms that request it
app.get(['/favicon.ico', '/favicon.png'], (req, res) => res.status(204).end());
app.use('/api/auth', userRouter);
app.use('/api/messages', messageRouter);

await connectDB();

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log("Server is running on PORT: " + PORT))
}

export default server;
