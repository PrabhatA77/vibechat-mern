import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs:15*60*1000, //15 min
    max:5,              //5 attempts per window
    message:{
        success:false,
        message:"Too many login attempts.Please try again later."
    },
    standardHeaders:true,
    legacyHeaders:false,
});

export const signupLimiter = rateLimit({
    windowMs:30*60*1000, //30 min
    max:5,
    message:{
        success:false,
        message:"Too many signup attempts.Please try again later."
    },
    standardHeaders:true,
    legacyHeaders:false,
});

export const otpLimiter = rateLimit({
    windowMs:5*60*1000, //5 minutes
    max:5,
    message:{
        success:false,
        message:"Too many OTP attempts.Please wait 5 minutes.",
    },
    standardHeaders:true,
    legacyHeaders:false,
});

export const forgotPasswordLimiter = rateLimit({
    windowMs:60*60*1000, //1hour
    max:3,
    message:{
        success:false,
        message:"Too many password reset requests. Try again in 1 hour.",
    },
    standardHeaders:true,
    legacyHeaders:false,
});
