import axios from "axios";
import { useState, useEffect, createContext } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const AuthContext = createContext();

// ⭐ IMPORTANT: socket.io must connect to backend URL directly
const backendUrl = "http://localhost:5000";

// ⭐ axios uses vite proxy for REST
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // ⭐ FIXED CHECK AUTH (prevent caching)
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check-auth", {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });

      if (data.success) {
        setAuthUser(data.user);   // <-- ONLY set user here
      }
    } catch (err) {
      console.log("check-auth failed:", err);
      setAuthUser(null);
    }
  };

  // ⭐ SIGNUP
  const signup = async (formData) => {
    try {
      const { data } = await axios.post("/api/auth/signup", formData);
      if (data.success) {
        toast.success(data.message);
        return data;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    }
  };

  // ⭐ LOGIN (NO SOCKET HERE)
  const login = async (formData) => {
    try {
      const { data } = await axios.post("/api/auth/login", formData, {
        headers: { "Cache-Control": "no-cache" },
      });

      if (data.success) {
        setAuthUser(data.user);   // <-- ONLY set user here
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

      if (socket) socket.disconnect();
      setSocket(null);

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


  // ⭐ SOCKET CONNECTION (fixed)
  const connectSocket = (user) => {
    if (!user || !user._id) {
      console.log("Socket not connected: invalid user", user);
      return;
    }

    if (socket) {
      console.log("Socket already exists");
      return;
    }

    const newSocket = io(backendUrl, {
      withCredentials: true,
      query: { userId: user._id },
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("socket connected", newSocket.id);
    });

    newSocket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users);
    });
  };

  // ⭐ NEW — CORRECT PLACE TO CONNECT SOCKET
  useEffect(() => {
    if (authUser && authUser._id) {
      connectSocket(authUser);
    }
  }, [authUser]);

  // Run checkAuth on load
  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        axios,
        authUser,
        onlineUsers,
        socket,
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
