import express from "express";
import { checkAuth, forgotPassword, login, logout, resendOTP, resetPassword, signup, updateProfile, verifyEmail } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { forgotPasswordLimiter, loginLimiter, otpLimiter, signupLimiter } from "../middleware/rateLimiter.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.get('/check-auth',verifyToken,checkAuth);

router.put('/update-profile',verifyToken,upload.single("avatar"),updateProfile);

router.post('/signup',signupLimiter,signup)
router.post('/login',loginLimiter,login);
router.post('/logout',logout);

router.post('/verify-email',otpLimiter,verifyEmail);
router.post("/resend-otp",otpLimiter,resendOTP)

router.post('/forgot-password',forgotPasswordLimiter,forgotPassword);
router.post('/reset-password',resetPassword);

export default router;
