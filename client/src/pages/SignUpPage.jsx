import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Mail, User, Lock, Loader } from "lucide-react";
import Input from "../components/Input";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import { AuthContext } from "../context/AuthContext.jsx";

const SignUpPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsDataSubmitted(true);

    if (!name || !email || !password || !bio) return;

    setIsLoading(true);

    const response = await signup({
      name,
      email,
      password,
      bio,
    });

    setIsLoading(false);

    if (response?.success) {
      navigate("/verify-email", { state: { email } });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-gray-700/30 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="p-8">
        <h2 className="text-3xl font-bold mb-6 text-center bg-linear-to-r from-purple-300 to-indigo-500 text-transparent bg-clip-text">
          Create Account
        </h2>

        <form onSubmit={handleSignup}>
          <Input icon={User} placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />

          <Input icon={Mail} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <Input icon={Lock} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <textarea
            className="w-full pl-3 pr-3 py-2 bg-gray-800 bg-opacity-40 rounded-lg border border-[#2a2540] 
                       focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 text-white 
                       placeholder-violet-200 transition duration-200 resize-none mt-4"
            placeholder="Bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          {isDataSubmitted && (!name || !email || !password || !bio) && (
            <p className="text-red-400 font-semibold mt-2">Please fill in all fields.</p>
          )}

          <PasswordStrengthMeter password={password} />

          <motion.button
            className="mt-5 w-full py-3 px-4 bg-linear-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isLoading}
          >
            {isLoading ? <Loader className="animate-spin mx-auto" size={24} /> : "Sign Up"}
          </motion.button>
        </form>
      </div>

      <div className="px-8 py-8 bg-gray-900 bg-opacity-50 flex justify-center">
        <p className="text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-indigo-300 hover:underline">Login</Link>
        </p>
      </div>
    </motion.div>
  );
};

export default SignUpPage;
