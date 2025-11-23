import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/Input";
import { AuthContext } from "../context/AuthContext.jsx";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await login({
      email,
      password,
    });

    // If login successful, redirect
    navigate("/");
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
          Welcome Back
        </h2>

        <form onSubmit={handleLogin}>
          <Input icon={Mail} type="email" name="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <Input icon={Lock} type="password" name="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <div className="flex items-center mb-6">
            <Link to="/forgot-password" className="text-sm text-purple-300 hover:underline">
              Forget password?
            </Link>
          </div>

          <motion.button
            className="mt-5 w-full py-3 px-4 bg-linear-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-lg shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Login
          </motion.button>
        </form>
      </div>

      <div className="px-8 py-8 bg-gray-900 bg-opacity-50 flex justify-center">
        <p className="text-sm text-gray-400">
          Don't have an account?{" "}
          <Link to="/signup" className="text-indigo-300 hover:underline">SignUp</Link>
        </p>
      </div>
    </motion.div>
  );
};

export default LoginPage;
