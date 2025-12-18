import express from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
// ✅ Naya Import: Group Routes
import groupRoutes from "./routes/groupRoutes.js"; 
import redisClient from "./lib/redis.js"; 
import { initializeBot } from "./lib/bot.js";

import { app, server, io } from "./lib/socket.js"; 

// Middleware setup
app.use(express.json({limit: "50mb"})); 
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// Routes setup
app.use("/api/status", (req, res)=> res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
// ✅ Naya Route: Groups ke liye setup
app.use("/api/groups", groupRoutes); 

// Redis Subscriber (Pub/Sub Logic)
const subscriber = redisClient.duplicate();

const startSubscriber = async () => {
    try {
        await subscriber.connect();
        console.log(" Redis Subscriber connected.");

        // 'user-updates' channel ko sunein
        await subscriber.subscribe("user-updates", (message) => {
            console.log("PUBSUB: Received message from 'user-updates' channel");
            
            const updatedUser = JSON.parse(message);

            // Profile update ko sabko broadcast karein
            io.emit("profile-updated", updatedUser);
        });

    } catch (error) {
        console.error("Failed to start Redis Subscriber:", error);
    }
}

// Server listen logic
if(process.env.NODE_ENV !== "production"){
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log("Server is running on PORT: " + PORT);
        connectDB();
        initializeBot(); // Bot ko start karein
        startSubscriber(); // Redis subscriber start karein
    });
}

export default server;