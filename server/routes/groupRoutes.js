import express from "express";
// Corrected the name to protectRoute and the file to authMiddleware.js
import { protectRoute } from '../middleware/authMiddleware.js';
import { 
    createGroup, 
    getMyGroups, 
    getGroupMessages 
} from "../controllers/groupController.js";

const router = express.Router();

// Using protectRoute to match your export
router.post("/create", protectRoute, createGroup);
router.get("/my-groups", protectRoute, getMyGroups);
router.get("/messages/:groupId", protectRoute, getGroupMessages);

export default router;