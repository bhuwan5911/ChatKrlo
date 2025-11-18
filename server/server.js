import express from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import redisClient from "./lib/redis.js"; 

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
app.use("/api/messages", messageRouter)


// <-- Redis Subscriber (Pub/Sub Logic)
const subscriber = redisClient.duplicate();

const startSubscriber = async () => {
    try {
        await subscriber.connect();
        console.log(" Redis Subscriber connected.");

        await subscriber.subscribe("user-updates", (message) => {
            console.log("PUBSUB: Received message from 'user-updates' channel");
            
            const updatedUser = JSON.parse(message);

            io.emit("profile-updated", updatedUser);
        });

    } catch (error) {
        console.error("Failed to start Redis Subscriber:", error);
    }
}

// Connect to MongoDB
if(process.env.NODE_ENV !== "production"){
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log("Server is running on PORT: " + PORT);
        connectDB();
        startSubscriber(); 
    });
}

// Export server for Vercel 
export default server;
