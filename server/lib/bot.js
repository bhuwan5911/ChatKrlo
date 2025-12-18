import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const initializeBot = async () => {
  try {
    const botEmail = "ai@quickchat.com";
    
    // 1. The new bio you want to set
    const newBio = "I am QuickChat AI, your personal genius assistant. How can I help you today?";

    // 2. Check if the Bot already exists
    const existingBot = await User.findOne({ email: botEmail });
    
    if (existingBot) {
        // If bot exists, UPDATE the bio just in case it was something else
        existingBot.bio = newBio;
        await existingBot.save();
        
        process.env.BOT_ID = existingBot._id.toString();
        console.log("🤖 QuickChat AI Bio updated!");
        return; 
    }

    // 3. If Bot doesn't exist, Create it for the first time
    const hashedPassword = await bcrypt.hash("secure_ai_password_123", 10);
    
    const newBot = await User.create({
        fullName: "QuickChat AI",
        email: botEmail,
        password: hashedPassword,
        profilePic: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png", 
        bio: newBio
    });

    console.log("🤖 QuickChat AI Bot created successfully!");
    process.env.BOT_ID = newBot._id.toString();

  } catch (error) {
    console.log("Error initializing bot:", error.message);
  }
};