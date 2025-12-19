import Group from "../models/group.js";
import Message from "../models/message.js";

// ✅ Create group
export const createGroup = async (req, res) => {
  try {
    const { name, members } = req.body;

    const group = await Group.create({
      name,
      admin: req.user._id,
      members: [req.user._id, ...members],
    });

    const populated = await Group.findById(group._id)
      .populate("members", "fullName profilePic email")
      .populate("admin", "fullName email");

    res.json({ success: true, group: populated });
  } catch {
    res.status(500).json({ success: false, message: "Group creation failed" });
  }
};

// ✅ Get my groups
export const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({
      members: req.user._id,
    })
      .populate("members", "fullName profilePic email")
      .populate("admin", "fullName email");

    res.json({ success: true, groups });
  } catch {
    res.status(500).json({ success: false, message: "Failed to load groups" });
  }
};

// ✅ Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      groupId: req.params.groupId,
    }).populate("senderId", "fullName profilePic");

    res.json({ success: true, messages });
  } catch {
    res.status(500).json({ success: false, message: "Failed to load messages" });
  }
};

// ✅ Add member
export const addMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false });

    if (!group.admin.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only admin can add" });
    }

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    const updated = await Group.findById(groupId)
      .populate("members", "fullName profilePic email")
      .populate("admin", "fullName email");

    res.json({ success: true, group: updated });
  } catch {
    res.status(500).json({ success: false, message: "Add member failed" });
  }
};

// ✅ Remove member
export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false });

    if (!group.admin.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only admin can remove" });
    }

    group.members = group.members.filter(id => id.toString() !== userId);
    await group.save();

    const updated = await Group.findById(groupId)
      .populate("members", "fullName profilePic email")
      .populate("admin", "fullName email");

    res.json({ success: true, group: updated });
  } catch {
    res.status(500).json({ success: false, message: "Remove member failed" });
  }
};

// ✅ Delete group
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (!group.admin.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only admin can delete group" });
    }

    await Group.findByIdAndDelete(req.params.groupId);
    await Message.deleteMany({ groupId: req.params.groupId });

    res.json({ success: true, message: "Group deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};
