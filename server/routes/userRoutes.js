import express from "express";
import { 
    checkAuth, 
    login, 
    signup, 
    updateProfile, 
    getUserById 
} from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = express.Router();

// Route to create a new user account
userRouter.post("/signup", signup);

// Route to login an existing user
userRouter.post("/login", login);

// Route to update user profile (only allowed if logged in)
userRouter.put("/update-profile", protectRoute, updateProfile);

// Route to check if user is logged in / valid token
userRouter.get("/check", protectRoute, checkAuth);

// Route to get a specific user by ID (only allowed if logged in)
userRouter.get("/users/:id", protectRoute, getUserById);

export default userRouter;
