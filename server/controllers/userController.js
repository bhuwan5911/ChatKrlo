import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import redisClient from "../lib/redis.js";

// Signup a new user
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  try {
    if (!fullName || !email || !password || !bio) {
      return res.json({ success: false, message: "Missing Details" });
    }
    const user = await User.findOne({ email });

    if (user) {
      return res.json({ success: false, message: "Account already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser._id);

    // --- CACHE PRE-WARMING ---
    const cacheKey = `user:${newUser._id}`;
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(newUser));
    console.log(`🔥 Cache Pre-warmed for new user: ${newUser._id}`);
    // -------------------------

    res.json({
      success: true,
      userData: newUser,
      token,
      message: "Account created successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Controller to login a user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userData = await User.findOne({ email });

    if (!userData) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);

    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userData._id);

    // --- CACHE WARMING ---
    const cacheKey = `user:${userData._id}`;
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(userData));
    console.log(`🔥 Cache Warmed on Login for user: ${userData._id}`);
    // ---------------------

    res.json({
      success: true,
      userData,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
  res.json({ success: true, user: req.user });
};

// Controller to update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;

    const userId = req.user._id;
    let updatedUser;

    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      const upload = await cloudinary.uploader.upload(profilePic);

      updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: upload.secure_url, bio, fullName },
        { new: true }
      );
    }

    // --- CACHE INVALIDATION ---
    const cacheKey = `user:${userId}`;
    console.log("🗑️ CACHE INVALIDATION: Deleting", cacheKey);
    await redisClient.del(cacheKey);
    // -------------------------

    // --- PUBSUB PUBLISH ---
    console.log("📢 PUBSUB: Publishing profile update to 'user-updates'");
    await redisClient.publish("user-updates", JSON.stringify(updatedUser));
    // ---------------------

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Controller to get user by ID (Cache-Aside Pattern)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `user:${id}`;

    // 1. Check Cache
    const cachedUser = await redisClient.get(cacheKey);

    if (cachedUser) {
      // CACHE HIT
      console.log(`✅ CACHE HIT: Data found in Redis for ${id}`);
      return res.status(200).json(JSON.parse(cachedUser));
    }

    // 2. Cache Miss - Fetch from DB
    console.log(`❌ CACHE MISS: Fetching from MongoDB for ${id}`);
    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Save to Cache
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(user));

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
