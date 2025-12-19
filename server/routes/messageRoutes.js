import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessage,
  markMessageAsSeen,
  clearPrivateChat,    
} from "../controllers/messageController.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.put("/seen/:id", protectRoute, markMessageAsSeen);

router.delete("/clear/:userId", protectRoute, clearPrivateChat);

export default router;
