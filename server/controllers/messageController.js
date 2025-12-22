import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";

// 1. Initialize dotenv immediately
dotenv.config();

// 2. Defensive Check: Check if key exists before initializing Groq
if (!process.env.GROQ_API_KEY) {
    console.error("❌ ERROR: GROQ_API_KEY is missing from your .env file!");
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const BOT_ID = process.env.BOT_ID;

// ✅ Users for sidebar
export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.json({ success: true, users });
  } catch {
    res.status(500).json({ success: false });
  }
};

// ✅ Get private messages
export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: id },
        { senderId: id, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch {
    res.status(500).json({ success: false });
  }
};

// ✅ Mark message seen
export const markMessageAsSeen = async (req, res) => {
  try {
    await Message.findByIdAndUpdate(req.params.id, { seen: true });
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
};

// ✅ Send message
export const sendMessage = async (req, res) => {
  try {
    const { text, image, groupId } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      imageUrl = upload.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId: groupId ? null : receiverId,
      groupId: groupId || null,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    if (groupId) {
      io.to(groupId).emit("newMessage", newMessage);
    } 
    else {
      const socketId = getReceiverSocketId(receiverId);
      if (socketId) io.to(socketId).emit("newMessage", newMessage);

      if (receiverId === BOT_ID) {
        handleAiResponse(text, senderId);
      }
    }

    res.json({ success: true, newMessage });
  } catch {
    res.status(500).json({ success: false });
  }
};

// ✅ Clear private chat
export const clearPrivateChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: otherUserId } = req.params;

    await Message.deleteMany({
      $or: [
        { senderId: myId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: myId },
      ],
    });

    res.json({ success: true, message: "Chat cleared" });
  } catch {
    res.status(500).json({ success: false, message: "Clear failed" });
  }
};

// ✅ FAST BOT REPLY (Optimized Error Handling)
async function handleAiResponse(text, senderId) {
  try {
    // If key is missing, don't even try to call the API
    if (!process.env.GROQ_API_KEY) {
        throw new Error("API Key is missing in environment variables");
    }

    const aiPromise = groq.chat.completions.create({
      messages: [{ role: "user", content: text || "Hello" }],
      model: "llama-3.1-8b-instant",
    });

    const timeoutPromise = new Promise(resolve =>
      setTimeout(() => resolve(null), 2000)
    );

    const result = await Promise.race([aiPromise, timeoutPromise]);

    const aiText =
      result?.choices?.[0]?.message?.content ||
      "I'm here 🙂 How can I help you?";

    const botMessage = new Message({
      senderId: BOT_ID,
      receiverId: senderId,
      text: aiText,
    });

    await botMessage.save();

    const socketId = getReceiverSocketId(senderId);
    if (socketId) io.to(socketId).emit("newMessage", botMessage);
  } catch (err) {
    // This will now catch the 401 and log it clearly
    console.error("🤖 Bot Error:", err.message);
  }
}