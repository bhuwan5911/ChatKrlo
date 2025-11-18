import mongoose from "mongoose";

// Define the structure of the User document in MongoDB
const userSchema = new mongoose.Schema({

    // User's unique email address (required for login)
    email: {
        type: String,
        required: true,
        unique: true   // Ensures no two users can register with the same email
    },

    // Full name of the user
    fullName: {
        type: String,
        required: true
    },

    // Hashed password (minimum length enforced)
    password: {
        type: String,
        required: true,
        minlength: 6   // Basic validation to enforce stronger passwords
    },

    // Profile picture stored as a base64 string or URL
    profilePic: {
        type: String,
        default: ""    // Default empty string if user has no picture
    },

    // Optional short biography for the user's profile
    bio: {
        type: String
    }

}, { 
    timestamps: true  // Automatically adds createdAt and updatedAt fields
})

// Create the User model using the schema
const User = mongoose.model("User", userSchema)

export default User
