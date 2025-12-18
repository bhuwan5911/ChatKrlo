import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Groq from "groq-sdk"; 
import dotenv from "dotenv";

dotenv.config();

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    res.status(200).json({ success: true, users: filteredUsers });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params; // This works for User ID or Group ID
    const myId = req.user._id;

    // We check if we are fetching 1v1 messages OR group messages
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
        { groupId: userToChatId } // Added check for group messages
      ],
    }).sort({ createdAt: 1 });

    if (!messages) return res.status(200).json({ success: true, messages: [] });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.log("Error in getMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, groupId } = req.body; // groupId added here
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // --- SMART ROUTING LOGIC ---
    const newMessage = new Message({
      senderId,
      text,
      image: imageUrl,
      groupId: groupId || null,
      receiverId: groupId ? null : receiverId,
    });

    await newMessage.save();

    if (groupId) {
      // 🏘️ LOGIC: BROADCAST TO GROUP
      io.to(groupId).emit("newMessage", newMessage);
      console.log(`Message broadcasted to room: ${groupId}`);
    } else {
      // 👤 LOGIC: PRIVATE 1v1
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }

      // --- AI BOT LOGIC (GROQ) ---
      const BOT_ID = process.env.BOT_ID; 
      if (receiverId === BOT_ID) {
        handleAiResponse(text, senderId, BOT_ID);
      }
    }

    res.status(201).json({ success: true, newMessage });

  } catch (error) {
    console.log("Error in sendMessage:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

// Helper function for AI logic to keep code clean
async function handleAiResponse(text, senderId, BOT_ID) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: text || "Hello!" }],
      model: "llama-3.1-8b-instant", 
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "I'm thinking...";

    const botMessage = new Message({
      senderId: BOT_ID,
      receiverId: senderId,
      text: aiResponse,
    });

    await botMessage.save();

    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", botMessage);
    }
  } catch (error) {
    console.error("AI Logic Error:", error.message);
  }
}