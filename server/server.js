import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import redisClient from "./lib/redis.js";
import { initializeBot } from "./lib/bot.js";

import { app, server, io } from "./lib/socket.js";

// ✅ Middlewares
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));

// ✅ Routes
app.get("/api/status", (req, res) => {
  res.send("Server is live");
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRoutes);

// ✅ Redis subscriber
const subscriber = redisClient.duplicate();

const startSubscriber = async () => {
  try {
    await subscriber.connect();
    console.log("Redis Subscriber connected.");

    await subscriber.subscribe("user-updates", (message) => {
      const updatedUser = JSON.parse(message);
      io.emit("profile-updated", updatedUser);
    });
  } catch (err) {
    console.error("Redis subscriber error:", err);
  }
};

// ✅ Start server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log("Server running on PORT:", PORT);
    connectDB();
    initializeBot();
    startSubscriber();
  });
}

export default server;
