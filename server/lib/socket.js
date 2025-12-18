import { Server } from "socket.io";
import http from "http";
import express from "express";

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

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  console.log(`User ${userId} connected with socket ${socket.id}`);

  // 1. BROADCAST ONLINE USERS
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // 2. JOIN GROUP ROOMS
  // When a user connects, we should technically make them join all their groups.
  // For now, we will provide a way for the frontend to tell the socket to join a group.
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`User ${userId} joined Group Room: ${groupId}`);
  });

  socket.on("leaveGroup", (groupId) => {
    socket.leave(groupId);
    console.log(`User ${userId} left Group Room: ${groupId}`);
  });

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };