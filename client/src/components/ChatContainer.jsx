import React, { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { AuthContext } from "../context/AuthContext.jsx";
import ImageUploadProgress from "../components/ImageUploadProgress.jsx";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SharedMediaModal from "./SharedMediaModal.jsx";


const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const messageContainerRef = useRef();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const { axios, authUser, socket, setAuthUser } = useContext(AuthContext);
  const navigate = useNavigate();

  // Mobile Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlockedBy, setIsBlockedBy] = useState(false);
  const [showSharedMedia, setShowSharedMedia] = useState(false);

  // Upload States
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Fetch messages
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`/api/messages/${selectedUser._id}`);
        if (data.success) {
          setMessages(data.messages);
          setTimeout(
            () => {
              if (messageContainerRef.current) {
                messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
              }
            },
            50
          );
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };
    fetchMessages();
  }, [selectedUser, axios]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      const otherId = selectedUser?._id;
      if (!otherId) return;

      const isRelated = newMsg.senderId === otherId;

      if (isRelated) {
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(
          () => {
            if (messageContainerRef.current) {
              messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
            }
          },
          50
        );
      }
    };

    const handleTyping = ({ from }) => {
      setTypingUsers((t) => ({ ...t, [from]: true }));
      setTimeout(() => {
        setTypingUsers((t) => {
          const copy = { ...t };
          delete copy[from];
          return copy;
        });
      }, 2000);
    };

    const handleUserBlocked = ({ blockerId }) => {
      if (blockerId === selectedUser._id) {
        setIsBlockedBy(true);
        toast.error("You have been blocked by this user.");
      }
    };

    const handleUserUnblocked = ({ blockerId }) => {
      if (blockerId === selectedUser._id) {
        setIsBlockedBy(false);
        toast.success("You have been unblocked by this user.");
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("userBlocked", handleUserBlocked);
    socket.on("userUnblocked", handleUserUnblocked);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("userBlocked", handleUserBlocked);
      socket.off("userUnblocked", handleUserUnblocked);
    };
  }, [socket, selectedUser]);

  // Auto scroll
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Typing emit
  const typingTimeoutRef = useRef(null);
  const emitTyping = () => {
    if (!socket || !selectedUser) return;
    socket.emit("typing", { to: selectedUser._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { to: selectedUser._id });
    }, 500);
  };

  // ⭐ SEND TEXT MESSAGE
  const handleSend = async (e) => {
    e.preventDefault();

    // If image selected → use image upload flow
    // If image selected → use image upload flow
    if (imageFile) {
      handleSendImage(imageFile);
      return;
    }

    if (!text.trim()) return;

    const tempMsg = {
      _id: `temp-${Date.now()}`,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: text.trim(),
      image: "",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        { text: text.trim(), image: "" }
      );

      if (data.newMessage) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMsg._id ? data.newMessage : msg
          )
        );
      } else {
        setMessages((prev) => prev.filter((msg) => msg._id !== tempMsg._id));
      }
    } catch (error) {
      console.error(error);
    }

    setText("");
  };

  // ⭐ SEND IMAGE WITH PROGRESS
  const handleSendImage = async (file) => {
    const fileToSend = file || imageFile;
    if (!fileToSend) return;

    setUploadingImage(fileToSend);

    // Preview bubble - REMOVED to show only progress bar first
    // const preview = URL.createObjectURL(fileToSend);
    // const tempMsg = { ... };
    // setMessages((prev) => [...prev, tempMsg]);

    // Multipart upload
    const formData = new FormData();
    formData.append("image", fileToSend);
    formData.append("text", "");

    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            const percent = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(percent);  // REAL PROGRESS HERE
          },
        }
      );

      // Replace preview with actual message
      // Store the new message to be added after delay
      const finalMessage = data.newMessage;

      // Reset uploading state with a small delay for smooth UX
      setTimeout(() => {
        if (finalMessage) {
          setMessages((prev) => [...prev, finalMessage]);
        }
        setUploadingImage(null);
        setUploadProgress(0);
        setImageFile(null);
      }, 1000);

    } catch (error) {
      console.error(error);
    }
  };



  // UI when no user selected
  if (!selectedUser)
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-indigo-200 bg-white/5 max-md:hidden">
        <img src={assets.logo} alt="" className="max-w-16" />
        <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
      </div>
    );

  // JSX
  return (
    <div className="h-full overflow-hidden relative backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.name}
        </p>

        {/* Mobile Menu */}
        <div className="relative md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#282142] border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden">
              <button
                onClick={() => navigate("/profile")}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => {
                  setShowSharedMedia(true);
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
              >
                Shared Media
              </button>
              <button
                onClick={async () => {
                  const isBlocked = authUser.blockedUsers.includes(selectedUser._id);
                  const action = isBlocked ? "unblock" : "block";

                  if (!window.confirm(`Are you sure you want to ${action} ${selectedUser.name}?`)) return;

                  try {
                    const { data } = await axios.put(`/api/messages/${action}/${selectedUser._id}`);
                    if (data.success) {
                      if (isBlocked) {
                        setAuthUser(prev => ({
                          ...prev,
                          blockedUsers: prev.blockedUsers.filter(id => id !== selectedUser._id)
                        }));
                        toast.success("User unblocked");
                      } else {
                        setAuthUser(prev => ({
                          ...prev,
                          blockedUsers: [...prev.blockedUsers, selectedUser._id]
                        }));
                        toast.success("User blocked");
                      }
                      setIsMenuOpen(false);
                    }
                  } catch (error) {
                    toast.error(`Failed to ${action} user`);
                  }
                }}
                className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 transition-colors"
              >
                {authUser.blockedUsers.includes(selectedUser._id) ? "Unblock User" : "Block User"}
              </button>
              <div className="h-px bg-gray-600 my-1" />
              <button
                onClick={() => {
                  logout();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={messageContainerRef}
        className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-24"
      >



        {/* Messages */}
        {messages.map((msg, index) => {
          if (!msg || !msg.senderId) return null;
          return (
            <div
              key={msg._id || index}
              className={`flex items-start gap-2 ${msg.senderId === authUser._id ? "justify-end" : "justify-start"
                }`}
            >
              <div className="text-center text-xs flex flex-col items-center gap-1">
                <img
                  src={
                    msg.senderId === authUser._id
                      ? authUser.profilePic || assets.avatar_icon
                      : selectedUser.profilePic || assets.avatar_icon
                  }
                  alt="profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
              </div>

              {msg.image ? (
                <img
                  src={msg.image}
                  alt=""
                  className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8"
                />
              ) : (
                <p
                  className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-words ${msg.senderId === authUser._id
                    ? "bg-indigo-500/30 text-white"
                    : "bg-gray-700/30 text-white"
                    }`}
                >
                  {msg.text}
                </p>
              )}
            </div>
          )
        })}

        {/* Typing indicator */}
        {typingUsers[selectedUser._id] && (
          <div className="flex items-center gap-2 ml-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></span>
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300"></span>
            </div>
            <p className="text-xs text-gray-400">typing...</p>
          </div>
        )}

        {/* Upload Progress Bubble - Moved to bottom */}
        {uploadingImage && (
          <div className="flex justify-end mb-6">
            <ImageUploadProgress
              progress={uploadProgress}
              onCancel={() => {
                setUploadingImage(null);
                setImageFile(null);
                setUploadProgress(0);
              }}
            />
          </div>
        )}


      </div>

      {/* Bottom Area */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-transparent">
        {authUser.blockedUsers.includes(selectedUser._id) || isBlockedBy ? (
          <div className="w-full text-center p-3 bg-red-500/10 text-red-400 rounded-lg">
            {isBlockedBy
              ? "You have been blocked by this user."
              : "You have blocked this user. Unblock to send messages."}
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
              <input
                type="text"
                placeholder="Send a message"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  emitTyping();
                }}
                className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent"
              />

              <input
                type="file"
                id="image"
                accept="image/png,image/jpeg"
                hidden
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  if (file.size > 10 * 1024 * 1024) {
                    toast.error("Image size should be less than 10MB");
                    return;
                  }

                  setImageFile(file);
                  handleSendImage(file);
                }}
              />

              <label htmlFor="image" title="Max file size: 10MB">
                <img
                  src={assets.gallery_icon}
                  alt=""
                  className="w-5 mr-2 cursor-pointer"
                />
              </label>
            </div>

            <button
              onClick={handleSend}
              className="p-2 bg-indigo-600 rounded-full"
            >
              <img src={assets.send_button} alt="" className="w-6" />
            </button>
          </>
        )}
      </div>

      {/* Shared Media Modal */}
      <SharedMediaModal
        isOpen={showSharedMedia}
        onClose={() => setShowSharedMedia(false)}
        selectedUser={selectedUser}
      />
    </div>
  );
};

export default ChatContainer;
