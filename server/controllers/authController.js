import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";

import { User } from "../models/User.js";

import { genVerificationCode } from "../utils/genVerificationCode.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { otpEmailTemplate } from "../utils/emailTemplate.js";
import {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../utils/sendEmail.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { name, email, password, bio } = req.body;

  try {
    if (!name || !email || !password || !bio) {
      return res
        .status(401)
        .json({ success: false, message: "All fields are required" });
    }

    const existUser = await User.findOne({ email });
    if (existUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = genVerificationCode();

    const user = new User({
      name,
      email,
      password: hashedPassword,
      bio,
      verificationToken: verificationCode,
      verificationTokenExpiresAt: Date.now() + 10 * 60 * 60 * 1000,
    });

    const emailMessage = otpEmailTemplate(verificationCode);
    await sendEmail(email, "Email Verification OTP", emailMessage);

    await user.save();
    
    generateTokenAndSetCookie(res, user._id);

    res.status(201).json({
      success: true,
      message:
        "User registered. Please verify your email with OTP sent to your email.",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    if (!code) {
      res
        .status(400)
        .json({ success: false, message: "Verification code is required" });
    }

    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Invalid or expired verification code",
        });
    }

    // check if code is correct and not expired
    if (
      user.verificationToken !== code ||
      user.verificationTokenExpiresAt < Date.now()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired code" });
    }

    // mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const login = async (req, res) => {

  const { email, password } = req.body;

  try {
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill the Email feild." });
    }
    if (!password) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill the password feild." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials." });
    }
    if (!user.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Please verify the user first." });
    }

    generateTokenAndSetCookie(res, user._id);

    user.lastLogin = Date.now();
    user.save();

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("Logged in error : ", error);
    res.status(400).json({ success: false, message: "Server error" });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account with that email exists, you will receive a password reset link shortly.",
      });
    }

    //generate reset token
    const resetPasswordToken = crypto.randomBytes(20).toString("hex");
    const resetPasswordTokenHash = crypto
      .createHash("sha256")
      .update(resetPasswordToken)
      .digest("hex");
    const resetPasswordTokenExpiresAt = Date.now() + 60 * 60 * 1000; //1 hr

    user.resetPasswordToken = resetPasswordTokenHash;
    user.resetPasswordExpiresAt = resetPasswordTokenExpiresAt;

    await user.save();

    //send email
    const resetLink = `${process.env.FRONTEND_URI}/reset-password?token=${resetPasswordToken}`;
    await sendPasswordResetEmail(email, user.name || "User", resetLink);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please fill the password feild.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    //update password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    await sendResetSuccessEmail(user.email);

    return res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in check auth:", error);
    return res.status(500).json({ success: false, message: "server error" });
  }
};

//! controller to update the user profile
export const updateProfile = async (req,res)=>{
  try {
    const {profilePic,name,bio} = req.body;

    const userId = req.user._id;

    let updatedUser;
    
    if(!profilePic){
      updatedUser = await User.findByIdAndUpdate(userId,{bio,name},{new:true});
    }
    else{
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedUser = await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,name},{new:true});
    }

    res.json({success:true,user:updatedUser});
  } catch (error) {
    console.log(error.message);
    res.json({success:false,message:error.message})
  }
}
