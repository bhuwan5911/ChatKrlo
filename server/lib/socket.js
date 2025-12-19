import { Server } from "socket.io";
import http from "http";
import express from "express";
import Group from "../models/group.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

const userSocketMap = {};

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} connected with socket ${socket.id}`);

    // ✅ AUTO JOIN ALL GROUP ROOMS OF THIS USER
    try {
      const groups = await Group.find({ members: userId }).select("_id");
      groups.forEach((g) => {
        socket.join(g._id.toString());
        console.log(`User ${userId} auto-joined group ${g._id}`);
      });
    } catch (err) {
      console.log("Error joining groups:", err.message);
    }
  }

  // ✅ Broadcast online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userId) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    console.log(`User ${userId} disconnected`);
  });
});

export { io, app, server };
