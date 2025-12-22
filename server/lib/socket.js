import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const userSocketMap = {}; // userId -> socketId

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log("🟢 User connected:", userId);
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // 📞 Call user
  socket.on("call-user", ({ to, from, offer, caller }) => {
    const toSocket = userSocketMap[to];
    if (toSocket) {
      io.to(toSocket).emit("incoming-call", {
        from,
        offer,
        caller,
      });
    }
  });

  // ✅ Answer call
  socket.on("answer-call", ({ to, answer }) => {
    const toSocket = userSocketMap[to];
    if (toSocket) {
      io.to(toSocket).emit("call-answered", { answer });
    }
  });

  // ❌ Reject call
  socket.on("reject-call", ({ to }) => {
    const toSocket = userSocketMap[to];
    if (toSocket) {
      io.to(toSocket).emit("call-rejected");
    }
  });

  // ☎️ End call
  socket.on("call-ended", ({ to }) => {
    const toSocket = userSocketMap[to];
    if (toSocket) {
      io.to(toSocket).emit("call-ended");
    }
  });

  // ❄️ ICE candidates  ✅ FIXED HERE
  socket.on("ice-candidate", ({ to, candidate }) => {
    const toSocket = userSocketMap[to];
    if (toSocket) {
      io.to(toSocket).emit("ice-candidate", { candidate }); // ✅ wrap in object
    }
  });

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
      console.log("🔴 User disconnected:", userId);
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
