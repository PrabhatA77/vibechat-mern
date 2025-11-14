import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Mail, User, Lock, Loader } from "lucide-react";  // FIXED import
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
  const [isLoading, setIsLoading] = useState(false);   // FIXED

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsDataSubmitted(true);

    if (!name || !email || !password || !bio) return;

    try {
      setIsLoading(true);
      await login("signup", { name, email, password, bio });

      navigate("/verify-email", { state: { email } });

    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
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
          <Input
            icon={User}
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            icon={Mail}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            icon={Lock}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="relative mb-6">
            <div className="absolute top-3 left-0 flex items-center pl-3 pointer-events-none">
              <User className="w-5 h-5 text-violet-300" />
            </div>

            <textarea
              className="w-full pl-10 pr-3 py-2 bg-gray-800 bg-opacity-40 rounded-lg border border-[#2a2540] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 text-white placeholder-violet-200 transition duration-200 resize-none"
              placeholder="Bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* ❌ Removed {error} — because error is not defined */}

          {isDataSubmitted && (!name || !email || !password || !bio) && (
            <p className="text-red-400 font-semibold mt-2">
              Please fill in all fields.
            </p>
          )}

          <PasswordStrengthMeter password={password} />

          <motion.button
            className="mt-5 w-full py-3 px-4 bg-linear-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader className="animate-spin mx-auto" size={24} />
            ) : (
              "Sign Up"
            )}
          </motion.button>
        </form>
      </div>

      <div className="px-8 py-8 bg-gray-900 bg-opacity-50 flex justify-center">
        <p className="text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-300 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default SignUpPage;
