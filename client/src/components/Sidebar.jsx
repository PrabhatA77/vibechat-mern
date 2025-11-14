import React, { useState } from "react";
import assets, { userDummyData } from "../assets/assets";
import { MoreVertical, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <motion.div
      animate={{width:selectedUser?"250px":"536px"}}
      transition={{duration:0.5,ease:"easeInOut"}}
      className={` bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${
        selectedUser ? "max-md:hidden" : ""
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
                  <p className="cursor-pointer text-sm hover:text-red-400">
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
            className="bg-transparent border-none text-white text-base placeholder-[#c8c8c8] flex-1"
            placeholder="Search User..."
          />
        </div>
      </div>

      <div className="flex flex-col">
        {userDummyData.map((user, index) => (
          <div
            onClick={() => setSelectedUser(user)}
            key={index}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm
    hover:bg-[#282142]/30 hover:scale-[1.02] transform transition-all duration-200
    ${selectedUser?._id === user._id && "bg-[#282142]/50"}`}
          >
            <img
              src={user?.profilePic || assets.avatar_icon}
              alt=""
              className="w-[45px] aspect-square rounded-full"
            />
            <div className="flex flex-col leading-5">
              <p className="text-indigo-100">{user.fullName}</p>
              {index < 3 ? (
                <span className="text-indigo-300 text-xs">Online</span>
              ) : (
                <span className="text-neutral-400 text-xs">Offline</span>
              )}
            </div>
            {index > 2 && (
              <p className="absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-indigo-500/40">
                {index}
              </p>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Sidebar;
