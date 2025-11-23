import React, { useEffect, useRef, useState, useContext } from "react";
import { motion } from "framer-motion";
import { useNavigate,useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { toast } from "react-hot-toast";
import { Loader } from "lucide-react";

const EmailVerificationPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);

  //timer states
  const [timer,setTimer] = useState(60);
  const [canResend,setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const { axios,authUser } = useContext(AuthContext);

  const {state}  = useLocation();
  const email = state?.email;

  //TIMER COUNTDOWN EFFECT
  useEffect(()=>{
    let interval;

    if(!canResend && timer > 0){
      interval = setInterval(()=>{
        setTimer((prev)=>prev-1)
      },1000);
    }

    if(timer === 0){
      setCanResend(true);
    }

    return () => clearInterval(interval);
  },[timer,canResend]);

  // Handle typing
  const handleChange = (index, value) => {
    if (value.length > 1) return; // prevent invalid multi-char type

    const updated = [...code];
    updated[index] = value;
    setCode(updated);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle paste of 6-digit OTP
  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").trim();

    if (paste.length === 6 && /^\d+$/.test(paste)) {
      const digits = paste.split("");
      setCode(digits);

      // Move focus to last box
      inputRefs.current[5].focus();
    }
    e.preventDefault();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const otp = code.join("");
    if (otp.length < 6) return;

    try {
      setIsVerifying(true);

      await axios.post("/api/auth/verify-email", { code: otp });

      // 🟢 CLEAR COOKIE so user can visit login page
      await axios.post("/api/auth/logout");

      toast.success("Email verified successfully! Please login.");

      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  //RESEND OTP FUNCTION
  const handleResendOtp = async ()=>{
    try {
      const {data} = await axios.post("/api/auth/resend-otp",{email});

      if(data.success){
        toast.success("A new OTP has been sent to your email!");

        //restart timer
        setTimer(60);
        setCanResend(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="max-w-md w-full bg-gray-700/30 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-8 bg-gray-800 bg-opacity-50 rounded-2xl shadow-xl"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-linear-to-r from-purple-300 to-indigo-500 text-transparent bg-clip-text">
          Verify Your Email
        </h2>

        <p className="text-center text-gray-300 mb-6">
          Enter the 6-digit code sent to your email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-2xl font-bold bg-gray-700 text-white 
                           border-2 border-gray-500 rounded-lg focus:border-green-500 outline-none"
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isVerifying || code.some((d) => !d)}
            className="w-full bg-linear-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg
                       hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50"
          >
            {isVerifying ? (
              <Loader className="animate-spin mx-auto" size={22} />
            ) : (
              "Verify Email"
            )}
          </motion.button>
        </form>

        {/* RESEND OTP BUTTON + TIMER */}
        <div className="mt-6 text-center">
          <motion.button
            onClick={handleResendOtp}
            disabled={!canResend}
            initial={{scale:1}}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`text-sm cursor-pointer font-semibold ${canResend ? "text-purple-400" : "text-gray-400"}`}
          >{canResend ? "Resend OTP" : `Resend in ${timer}s`}</motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerificationPage;
