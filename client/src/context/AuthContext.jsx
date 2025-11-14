import axios from "axios";
import { useState, useEffect, createContext } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    const [loading, setLoading] = useState(true);   // ⭐ FIX

    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check-auth");

            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (err) {
            setAuthUser(null); // not logged in
        } finally {
            setLoading(false);   // ⭐ MUST SET THIS
        }
    };

    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials);

            if (data.success) {
                setAuthUser(data.userData);
                connectSocket(data.userData);
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(err.message);
        }
    };

    const logout = async () => {
        try {
            await axios.post("/api/auth/logout");

            setAuthUser(null);
            setOnlineUsers([]);

            if (socket) {
                socket.disconnect();
            }

            toast.success("Logged out successfully.");
        } catch (err) {
            toast.error(err.message);
        }
    };

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put(`/api/auth/update-profile`, body);

            if (data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully.");
            }

        } catch (err) {
            toast.error(err.message);
        }
    };

    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;

        const newSocket = io(backendUrl, {
            query: { userId: userData._id },
            withCredentials: true
        });

        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
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
                socket,
                login,
                logout,
                updateProfile,
                loading          // ⭐ EXPOSE LOADING
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
