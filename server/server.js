import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
// <-- IMPORTANT: Client ko import karein taaki use duplicate kar sakein
import redisClient from "./lib/redis.js"; 

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app)

// Initialize socket.io server
export const io = new Server(server, {
    cors: {origin: "*"}
})

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handler
io.on("connection", (socket)=>{
    // ... (aapka connection logic waisa hi hai) ...
})

// Middleware setup
app.use(express.json({limit: "40mb"}));
app.use(cors());

// Routes setup
app.use("/api/status", (req, res)=> res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter)


// <-- NAYA KAAM: SUBSCRIBE
// Ek naya client banayein jo sirf subscribe karega
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
            io.emit("profile-updated", updatedUser);
        });

    } catch (error) {
        console.error("Failed to start Redis Subscriber:", error);
    }
}

// Connect to MongoDB
await connectDB();
startSubscriber(); 

if(process.env.NODE_ENV !== "production"){
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, ()=> console.log("Server is running on PORT: " + PORT));
}

// Export server for Vervel
export default server;