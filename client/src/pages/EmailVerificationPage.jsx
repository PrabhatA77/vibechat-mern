import React, { useEffect, useRef, useState, useContext } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const EmailVerificationPage = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const { axios } = useContext(AuthContext);

  const handleChange = (index, value) => {
    const newCode = [...code];

    // handle paste
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
      setCode(newCode);

      const lastFilled = newCode.findLastIndex((d) => d !== "");
      const autoFocusIndex = lastFilled < 5 ? lastFilled + 1 : 5;
      inputRefs.current[autoFocusIndex].focus();
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const verificationCode = code.join("");

    try {
      await axios.post("/api/auth/verify-email", { code: verificationCode });
      toast.success("Email Verified Successfully");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Verification failed");
    }
  };

  useEffect(() => {
    if (code.every((digit) => digit !== "")) {
      handleSubmit(new Event("submit"));
    }
  }, [code]);

  return (
    <div className="max-w-md w-full bg-gray-700/30 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-8 max-w-md w-full bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden"
      >
        <h2 className="text-3xl font-bold mb-6 text-center bg-linear-to-r from-purple-300 to-indigo-500 text-transparent bg-clip-text">
          Verify Your Email
        </h2>
        <p className="text-center text-gray-300 mb-6">
          Enter the 6-digit code sent to your email address.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-between">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength="6"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-2xl font-bold bg-gray-700 text-white border-2 border-gray-500 rounded-lg focus:border-green-500 focus:outline-none"
              />
            ))}
          </div>

          {error && <p className="text-red-500 font-semibold mt-2">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || code.some((digit) => !digit)}
            className="w-full bg-linear-to-r from-purple-500 to-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
          >
            {isLoading ? "Verifying" : "Verify Email"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default EmailVerificationPage;
