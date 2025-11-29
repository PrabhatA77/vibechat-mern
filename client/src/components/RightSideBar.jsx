import React, { useContext, useEffect, useState } from 'react'
import toast from "react-hot-toast";
import assets from '../assets/assets';
import { motion } from "framer-motion";
import { AuthContext } from '../context/AuthContext';
import { Ban, Trash2 } from 'lucide-react';

const RightSideBar = ({ selectedUser, selectedMessages, clearSelection }) => {
  const { logout, onlineUsers, axios, authUser, setAuthUser } = useContext(AuthContext);
  const isOnline = onlineUsers.includes(selectedUser?._id);
  const [media, setMedia] = useState([]);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchMedia = async () => {
      try {
        const { data } = await axios.get(`/api/messages/${selectedUser._id}`);
        if (data.success) {
          const images = data.messages.filter(msg => msg.image);
          setMedia(images);
        }
      } catch (error) {
        console.error(error);
      }
    }
    fetchMedia();
  }, [selectedUser, axios]);

  if (!selectedUser) {
    return <div className='hidden md:flex bg-[#8185B2]/10 w-full h-full'></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.9 }}
      className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? "max-md:hidden" : ""}`}>
      <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
        <img src={selectedUser?.profilePic || assets.avatar_icon} alt=""
          className='w-20 aspect-square rounded-full object-cover' />
        <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
          <p className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></p>
          {selectedUser.name}
        </h1>
        <p className='px-10 mx-auto text-center text-gray-300'>{selectedUser.bio || "No bio available"}</p>
      </div>

      <hr className='border-[#ffffff50] my-4' />

      <div className='px-5 text-xs'>
        <p className='mb-2 font-medium'>Shared Media</p>
        {media.length > 0 ? (
          <div className='max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-2 opacity-80 pr-1'>
            {media.map((msg) => (
              <div key={msg._id} onClick={() => window.open(msg.image)} className='cursor-pointer rounded overflow-hidden aspect-square border border-white/10 hover:opacity-80 transition'>
                <img src={msg.image} alt="" className='w-full h-full object-cover' />
              </div>
            ))}
          </div>
        ) : (
          <p className='text-gray-400 italic'>No media shared yet</p>
        )}
      </div>

      <div className='mt-8 px-6 flex flex-col gap-3'>
        {selectedMessages && selectedMessages.size > 0 && (
          <button
            onClick={async () => {
              if (!window.confirm(`Delete ${selectedMessages.size} messages?`)) return;
              try {
                const { data } = await axios.post('/api/messages/delete-selected', {
                  messageIds: Array.from(selectedMessages)
                });
                if (data.success) {
                  clearSelection();
                  toast.success("Messages deleted");
                }
              } catch (error) {
                console.error(error);
                toast.error("Failed to delete messages");
              }
            }}
            className='w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors'
          >
            <Trash2 size={16} />
            Delete Selected ({selectedMessages.size})
          </button>
        )}
        <button
          onClick={async () => {
            if (!window.confirm("Are you sure you want to clear this chat?")) return;
            try {
              const { data } = await axios.delete(`/api/messages/delete/${selectedUser._id}`);
              if (data.success) {
                setMedia([]);
                alert("Chat cleared successfully");
              }
            } catch (error) {
              console.error(error);
              alert("Failed to clear chat");
            }
          }}
          className='w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors'
        >
          <Trash2 size={16} />
          Clear Chat
        </button>

        {selectedUser.isGroup && selectedUser.admins.some(admin => admin._id === authUser._id) && (
          <button
            onClick={async () => {
              if (!window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;
              try {
                const { data } = await axios.delete(`/api/groups/${selectedUser._id}`);
                if (data.success) {
                  toast.success("Group deleted successfully");
                  window.location.reload();
                }
              } catch (error) {
                console.error(error);
                toast.error("Failed to delete group");
              }
            }}
            className='w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors'
          >
            <Trash2 size={16} />
            Delete Group
          </button>
        )}

        {!selectedUser.isGroup && (
          <button
            onClick={async () => {
              const isBlocked = authUser.blockedUsers.includes(selectedUser._id);
              const action = isBlocked ? "unblock" : "block";

              if (!window.confirm(`Are you sure you want to ${action} ${selectedUser.name}?`)) return;

              try {
                const { data } = await axios.put(`/api/messages/${action}/${selectedUser._id}`);
                if (data.success) {
                  // Update local state manually to reflect change immediately
                  if (isBlocked) {
                    setAuthUser(prev => ({
                      ...prev,
                      blockedUsers: prev.blockedUsers.filter(id => id !== selectedUser._id)
                    }));
                    alert("User unblocked successfully");
                  } else {
                    setAuthUser(prev => ({
                      ...prev,
                      blockedUsers: [...prev.blockedUsers, selectedUser._id]
                    }));
                    alert("User blocked successfully");
                  }
                }
              } catch (error) {
                console.error(error);
                alert(`Failed to ${action} user`);
              }
            }}
            className={`w-full py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${authUser?.blockedUsers?.includes(selectedUser._id)
              ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
              : 'bg-stone-500/10 hover:bg-stone-500/20 text-stone-400'
              }`}
          >
            <Ban size={16} />
            {authUser?.blockedUsers?.includes(selectedUser._id) ? "Unblock User" : "Block User"}
          </button>
        )}
      </div>

      <div
        className='absolute bottom-5 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm font-light cursor-pointer hover:text-white transition-colors'
        onClick={logout}
      >
        Logout
      </div>
    </motion.div>
  )
}

export default RightSideBar;