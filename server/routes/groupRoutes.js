import express from "express";
import { protectRoute } from "../middleware/authMiddleware.js";
import {
  createGroup,
  getMyGroups,
  getGroupMessages,
  addMember,
  removeMember,
  deleteGroup,   
} from "../controllers/groupController.js";

const router = express.Router();

router.post("/create", protectRoute, createGroup);
router.get("/my-groups", protectRoute, getMyGroups);
router.get("/messages/:groupId", protectRoute, getGroupMessages);
router.post("/add-member", protectRoute, addMember);
router.post("/remove-member", protectRoute, removeMember);

router.delete("/:groupId", protectRoute, deleteGroup);

export default router;
