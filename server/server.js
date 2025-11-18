import express from "express";
import "dotenv/config";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import redisClient from "./lib/redis.js"; 

// <-- CHANGE 1: app, server, aur io teeno ko wahan se import karein
import { app, server, io } from "./lib/socket.js"; 

// <-- CHANGE 2: Yahan se 'const app = ...', 'const server = ...' aur 'io' ka initialization HATA DIYA GAYA HAI.
// Kyunki woh ab socket.js mein ban rahe hain.

// Middleware setup
app.use(express.json({limit: "50mb"})); // Limit badha dijiye images ke liye
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

        // 'user-updates' channel ko sunein
        await subscriber.subscribe("user-updates", (message) => {
            console.log("PUBSUB: Received message from 'user-updates' channel");
            
            // Message ko JSON mein parse karein
            const updatedUser = JSON.parse(message);

            // Sabhi connected clients ko update bhej dein
            // Yahan hum imported 'io' use kar rahe hain
            io.emit("profile-updated", updatedUser);
        });

    } catch (error) {
        console.error("Failed to start Redis Subscriber:", error);
    }
}

// Connect to MongoDB
// Note: 'server.listen' use karein, 'app.listen' nahi
if(process.env.NODE_ENV !== "production"){
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log("Server is running on PORT: " + PORT);
        connectDB();
        startSubscriber(); // Subscriber yahan start karein
    });
}

// Export server for Vercel (agar chahiye toh)
export default server;