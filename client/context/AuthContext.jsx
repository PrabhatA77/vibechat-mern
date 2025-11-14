import axios from "axios";
import { useState, useEffect, createContext } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;  // ⭐ REQUIRED FOR COOKIES

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {

    const [authUser, setAuthUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    //! check if user is authenticated (cookie automatically sent)
    const checkAuth = async () => {
        try {
            const { data } = await axios.get("/api/auth/check-auth");

            if (data.success) {
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        } catch (err) {
            setAuthUser(null);
        }
    };

    //! login: token comes from cookie, no storage needed
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

    //! logout: backend clears the cookie
    const logout = async () => {
        try {
            await axios.post("/api/auth/logout"); // backend clears cookie

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

    //! update profile
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

    //! connect socket
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;

        const newSocket = io(backendUrl, {
            query: { userId: userData._id },
            withCredentials: true     // ⭐ send cookies during WS connection
        });

        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds);
        });
    };

    //! run once
    useEffect(() => {
        checkAuth();
    }, []);

    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
