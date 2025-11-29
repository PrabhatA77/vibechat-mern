import React, { useEffect, useState, useContext } from "react";
import assets from "../assets/assets";
import { MoreVertical, Search, Bot, Users, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext.jsx";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [unseen, setUnseen] = useState({}); // {userId:count}
  const { axios, onlineUsers, logout, socket } = useContext(AuthContext);

  useEffect(() => {
    // fetch users and groups
    const fetchData = async () => {
      try {
        const [usersRes, groupsRes] = await Promise.all([
          axios.get("/api/messages/users"),
          axios.get("/api/groups")
        ]);

        if (usersRes.data.success) {
          setUsers(usersRes.data.users);
          setUnseen(usersRes.data.unseenMessages || {});
        }
        if (groupsRes.data.success) {
          setGroups(groupsRes.data.groups);
        }
      } catch (error) {
        console.error("Failed to fetch data: ", error);
      }
    };

    fetchData();

    if (socket) {
      socket.on("newGroup", (newGroup) => {
        setGroups(prev => [newGroup, ...prev]);
      });
      return () => socket.off("newGroup");
    }
  }, [socket, axios]);

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
                  <hr className="my-2 border-t border-gray-500" />
                  <p
                    onClick={() => {
                      setIsCreateGroupOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="cursor-pointer text-sm hover:text-indigo-300 flex items-center gap-2"
                  >
                    <Plus size={14} /> Create Group
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <CreateGroupModal isOpen={isCreateGroupOpen} onClose={() => setIsCreateGroupOpen(false)} />

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
            flex-1 w-full"
            placeholder="Search here..."
          />
        </div>
      </div>

      {/* GROUPS LIST */}
      {groups.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-2 uppercase font-semibold tracking-wider">Groups</p>
          <div className="flex flex-col gap-1">
            {groups.map((group) => (
              <div
                key={group._id}
                onClick={() => setSelectedUser({ ...group, isGroup: true })}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 ${selectedUser?._id === group._id ? "bg-indigo-600/20 border border-indigo-500/30" : ""
                  }`}
              >
                <div className="relative">
                  <img
                    src={group.profilePic || assets.avatar_icon}
                    alt="group"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-[#282142] rounded-full p-0.5">
                    <Users size={12} className="text-indigo-400" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <p className="font-medium truncate text-gray-100">{group.name}</p>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {group.members.length} members
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USERS LIST */}
      <p className="text-xs text-gray-400 mb-2 uppercase font-semibold tracking-wider">Direct Messages</p>
      <div className="flex flex-col gap-1">
        {users.map((user) => (
          <div
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5 ${selectedUser?._id === user._id ? "bg-indigo-600/20 border border-indigo-500/30" : ""
              }`}
          >
            <div className="relative">
              <img
                src={user.profilePic || assets.avatar_icon}
                alt="profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              {isOnline(user._id) && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#282142]"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <p className="font-medium truncate text-gray-100 flex items-center gap-1">
                  {user.name}
                  {user.isAI && <Bot size={14} className="text-indigo-400" />}
                </p>
                {unseen[user._id] > 0 && (
                  <span className="bg-indigo-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unseen[user._id]}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate ${unseen[user._id] > 0 ? "text-indigo-300 font-medium" : "text-gray-400"
                }`}>
                {user.isAI ? "AI Assistant" : (user.bio || "Available")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Sidebar;
