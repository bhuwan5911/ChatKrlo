import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";

// 1. Create a New Group
export const createGroup = async (req, res) => {
  try {
    const { name, members, description } = req.body;
    const adminId = req.user._id;

    if (!name || !members || members.length < 1) {
      return res.status(400).json({ success: false, message: "Group name and at least one member are required" });
    }

    // Add the admin to the members list automatically
    const allMembers = [...new Set([...members, adminId.toString()])];

    const newGroup = new Group({
      name,
      description,
      admin: adminId,
      members: allMembers,
    });

    await newGroup.save();
    res.status(201).json({ success: true, group: newGroup });
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 2. Get all Groups I am a part of
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    // Find groups where my ID is in the 'members' array
    const groups = await Group.find({ members: userId }).populate("admin", "fullName email");
    res.status(200).json({ success: true, groups });
  } catch (error) {
    console.error("Error in getMyGroups:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 3. Get Messages for a specific Group
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const messages = await Message.find({ groupId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error in getGroupMessages:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};