import axios from "axios";
import { useState, useEffect, createContext } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const AuthContext = createContext();

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // ⭐ CHECK AUTH
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check-auth");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch {
      setAuthUser(null);
    }
  };

  // ⭐ SIGNUP (separate function)
  const signup = async (formData) => {
    try {
      const { data } = await axios.post("/api/auth/signup", formData);

      if (data.success) {
        toast.success(data.message);
        return data; // return so signup page can redirect to verify-email
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    }
  };

  // ⭐ LOGIN (separate function)
  const login = async (formData) => {
    try {
      const { data } = await axios.post("/api/auth/login", formData);

      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
        toast.success("Logged in successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    }
  };

  // ⭐ LOGOUT
  const logout = async () => {
    try {
      await axios.post("/api/auth/logout");
      setAuthUser(null);
      setOnlineUsers([]);
      socket?.disconnect();
      toast.success("Logged out");
    } catch (e) {
      toast.error("Logout failed");
    }
  };

  // ⭐ UPDATE PROFILE
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated");
      }
    } catch (e) {
      toast.error("Profile update failed");
    }
  };

  // ⭐ SOCKET CONNECTION
  const connectSocket = (user) => {
    if (!user || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: { userId: user._id },
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        axios,
        authUser,
        onlineUsers,
        signup,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
