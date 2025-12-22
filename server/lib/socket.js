import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"], // Support multiple origins
    credentials: true,
  },
  transports: ["websocket", "polling"], // Add fallback
});

const userSocketMap = {}; // userId -> socketId

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log("🟢 User connected:", userId, "| Socket ID:", socket.id);
  } else {
    console.log("⚠️ Connection without userId");
  }

  // Emit updated online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // 📞 Call user
  socket.on("call-user", ({ to, from, offer, caller }) => {
    console.log("📞 Call from", from, "to", to);
    const toSocket = userSocketMap[to];
    
    if (toSocket) {
      io.to(toSocket).emit("incoming-call", {
        from,
        offer,
        caller,
      });
      console.log("✅ Call signal sent to", to);
    } else {
      console.log("❌ User not online:", to);
      // Optionally notify caller that user is offline
      socket.emit("user-offline", { userId: to });
    }
  });

  // ✅ Answer call
  socket.on("answer-call", ({ to, answer }) => {
    console.log("✅ Answer call to", to);
    const toSocket = userSocketMap[to];
    
    if (toSocket) {
      io.to(toSocket).emit("call-answered", { answer });
      console.log("✅ Answer sent to", to);
    } else {
      console.log("❌ Caller not online:", to);
    }
  });

  // ❌ Reject call
  socket.on("reject-call", ({ to }) => {
    console.log("❌ Call rejected by", userId, "to", to);
    const toSocket = userSocketMap[to];
    
    if (toSocket) {
      io.to(toSocket).emit("call-rejected");
      console.log("✅ Rejection sent to", to);
    }
  });

  // ☎️ End call
  socket.on("call-ended", ({ to }) => {
    console.log("☎️ Call ended by", userId, "to", to);
    const toSocket = userSocketMap[to];
    
    if (toSocket) {
      io.to(toSocket).emit("call-ended");
      console.log("✅ End call signal sent to", to);
    }
  });

  // ❄️ ICE candidates
  socket.on("ice-candidate", ({ to, candidate }) => {
    const toSocket = userSocketMap[to];
    
    if (toSocket && candidate) {
      io.to(toSocket).emit("ice-candidate", { candidate });
      console.log("❄️ ICE candidate sent from", userId, "to", to);
    } else if (!candidate) {
      console.log("⚠️ Received null ICE candidate");
    } else {
      console.log("❌ Target user not online for ICE:", to);
    }
  });

  // 💬 Send message (if you have this feature)
  socket.on("sendMessage", (message) => {
    const receiverSocketId = userSocketMap[message.receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }
  });

  // 🔴 Disconnect
  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
      console.log("🔴 User disconnected:", userId);
      
      // Emit updated online users list
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error("❌ Socket error:", error);
  });
});

// Middleware to log all socket events (useful for debugging)
io.use((socket, next) => {
  console.log("🔌 Socket middleware - Connection attempt");
  next();
});

export { io, app, server };