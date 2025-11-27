import React, { useEffect, useState, useContext } from "react";
import assets from "../assets/assets";
import { MoreVertical, Search, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext.jsx";

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [unseen, setUnseen] = useState({}); // {userId:count}
  const { axios, onlineUsers, logout } = useContext(AuthContext);

  useEffect(() => {
    // fetch users from backend
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get("/api/messages/users");
        if (data.success) {
          setUsers(data.users);
          setUnseen(data.unseenMessages || {});
        }
      } catch (error) {
        console.error("Failed to fetch users: ", error);
      }
    };

    fetchUsers();
    // you can re-fetch periodically or on socket onlineUsers change if needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isOnline = (userId) => onlineUsers?.includes(userId);

  return (
    <motion.div
      animate={{ width: selectedUser ? "250px" : "536px" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className={` bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? "max-md:hidden" : ""
        }`}
    >
      <div className="pb-5">
        {/* Header section */}
        <div className="flex justify-between items-center">
          {/* LEFT: Logo + Name */}
          <div className="flex items-center gap-2">
            <img
              src={assets.logo}
              alt="logo"
              className="w-8 h-8 object-contain"
            />
            <p className="text-lg font-semibold text-gray-300">Vibechat</p>
          </div>

          {/* RIGHT: MoreVertical Icon + Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setIsMenuOpen(true)}
            onMouseLeave={() => setIsMenuOpen(false)}
          >
            <MoreVertical className="w-5 h-5 text-gray-300 cursor-pointer hover:text-white transition" />

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.25 }}
                  className="absolute right-0 mt-2 z-20 w-32 p-3 rounded-md bg-[#282142] border border-gray-600 text-gray-100 shadow-lg"
                >
                  <p
                    onClick={() => navigate("/profile")}
                    className="cursor-pointer text-sm hover:text-purple-300"
                  >
                    Edit Profile
                  </p>
                  <hr className="my-2 border-t border-gray-500" />
                  <p onClick={logout} className="cursor-pointer text-sm hover:text-red-400">
                    Logout
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            className="bg-transparent 
            outline-none 
            focus:outline-none 
            focus:ring-0 
            focus:border-none
            text-white 
            text-base 
            placeholder-[#c8c8c8] 
            border-none 
            flex-1"
            placeholder="Search User..."
          />
        </div>
      </div>

      <div className="flex flex-col">
        {users.length > 0 ? (
          users.map((user) => (
            <div
              onClick={() => setSelectedUser(user)}
              key={user._id}
              className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm
    hover:bg-[#282142]/30 hover:scale-[1.02] transform transition-all duration-200
    ${selectedUser?._id === user._id ? "bg-[#282142]/50" : ""}`}
            >
              <img
                src={user?.profilePic || assets.avatar_icon}
                alt=""
                className="w-[45px] aspect-square rounded-full"
              />
              <div className="flex flex-col leading-5">
                <p className="text-indigo-100 flex items-center gap-1">
                  {user.name}
                  {user.isAI && <Bot size={14} className="text-blue-400" />}
                </p>
                <span
                  className={`text-xs ${isOnline(user._id) ? "text-green-300" : "text-neutral-400"
                    }`}
                >
                  {isOnline(user._id) ? "Online" : "Offline"}
                </span>
              </div>

              {/* unseen messages count */}
              {unseen[user._id] > 0 && (
                <p className="absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-indigo-500/80">
                  {unseen[user._id]}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="px-4 py-8">
            <p className="text-center text-gray-400">
              No other users found. Create another account in a separate browser
              or device to start chatting.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;
