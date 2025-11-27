import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, },
    email: { type: String, required: true, unique: true, trim: true, },
    password: { type: String, required: true, },
    lastLogin: { type: Date, default: Date.now, },
    isVerified: { type: Boolean, default: false, },
    profilePic: { type: String, default: "" },
    bio: { type: String },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isAI: { type: Boolean, default: false },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);