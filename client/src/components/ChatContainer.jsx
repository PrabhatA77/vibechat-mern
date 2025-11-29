import React, { useEffect, useRef, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import assets from "../assets/assets";
import { Send, Image, X, Trash2, ArrowLeft, MoreVertical, Loader2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { formatMessageTime } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import ImageUploadProgress from "./ImageUploadProgress";

const ChatContainer = ({ selectedUser, setSelectedUser, selectedMessages, toggleMessageSelection, clearSelection }) => {
  const { authUser, setAuthUser, socket, axios, onlineUsers } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [typingUsers, setTypingUsers] = useState({});
  const [isBlockedBy, setIsBlockedBy] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSharedMedia, setShowSharedMedia] = useState(false);

  const messageContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  const isOnline = onlineUsers.includes(selectedUser?._id);

  // Handle textarea auto-resize
  const handleInput = (e) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
    emitTyping();
  };

  // Fetch messages
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const url = selectedUser.isGroup
          ? `/api/groups/${selectedUser._id}/messages`
          : `/api/messages/${selectedUser._id}`;

        const { data } = await axios.get(url);
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
      const isGroupMsg = newMsg.groupId;
      const isCurrentChat = isGroupMsg
        ? newMsg.groupId === selectedUser?._id
        : newMsg.senderId === selectedUser?._id;

      if (isCurrentChat) {
        setMessages((prev) => {
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
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

    const handleGroupMessage = (newMsg) => {
      if (selectedUser?.isGroup && newMsg.groupId === selectedUser._id) {
        setMessages((prev) => {
          if (prev.some(m => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => {
          if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
          }
        }, 50);
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

    const handleMessagesDeleted = ({ messageIds }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (messageIds.includes(msg._id)) {
            return { ...msg, isDeleted: true, text: "This message was deleted", image: "" };
          }
          return msg;
        })
      );
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("newGroupMessage", handleGroupMessage);
    socket.on("typing", handleTyping);
    socket.on("userBlocked", handleUserBlocked);
    socket.on("userUnblocked", handleUserUnblocked);
    socket.on("messagesDeleted", handleMessagesDeleted);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("newGroupMessage", handleGroupMessage);
      socket.off("typing", handleTyping);
      socket.off("userBlocked", handleUserBlocked);
      socket.off("userUnblocked", handleUserUnblocked);
      socket.off("messagesDeleted", handleMessagesDeleted);
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
    if (!socket || !selectedUser || selectedUser.isGroup) return; // No typing for groups yet
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
    if (imageFile) {
      handleSendImage(imageFile);
      return;
    }

    if (!text.trim()) return;

    const tempMsg = {
      _id: `temp-${Date.now()}`,
      senderId: authUser._id,
      receiverId: selectedUser.isGroup ? null : selectedUser._id,
      groupId: selectedUser.isGroup ? selectedUser._id : null,
      text: text.trim(),
      image: "",
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, tempMsg]);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const url = selectedUser.isGroup
        ? `/api/groups/${selectedUser._id}/messages`
        : `/api/messages/send/${selectedUser._id}`;

      const { data } = await axios.post(url, { text: tempMsg.text, image: "" });

      if (data.newMessage) {
        setMessages((prev) => {
          // If message already exists (e.g. from socket), remove temp message
          if (prev.some(msg => msg._id === data.newMessage._id)) {
            return prev.filter(msg => msg._id !== tempMsg._id);
          }
          // Otherwise replace temp message with real one
          return prev.map((msg) =>
            msg._id === tempMsg._id ? data.newMessage : msg
          );
        });
      } else {
        setMessages((prev) => prev.filter((msg) => msg._id !== tempMsg._id));
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMsg._id));
      toast.error("Failed to send message");
    }
  };

  // ⭐ SEND IMAGE WITH PROGRESS
  const handleSendImage = async (file) => {
    const fileToSend = file || imageFile;
    if (!fileToSend) return;

    setUploadingImage(fileToSend);

    // Multipart upload
    const formData = new FormData();
    formData.append("image", fileToSend);
    formData.append("text", "");

    try {
      const url = selectedUser.isGroup
        ? `/api/groups/${selectedUser._id}/messages`
        : `/api/messages/send/${selectedUser._id}`;

      const { data } = await axios.post(
        url,
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
          setMessages((prev) => {
            if (prev.some(m => m._id === finalMessage._id)) return prev;
            return [...prev, finalMessage];
          });
        }
        setUploadingImage(null);
        setUploadProgress(0);
        setImageFile(null);
      }, 1000);

    } catch (error) {
      console.error(error);
      setUploadingImage(null);
      setUploadProgress(0);
      setImageFile(null);
      toast.error("Failed to send image");
    }
  };

  // UI when no user selected
  if (!selectedUser)
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#8185B2]/10 text-white p-6 max-md:hidden">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold">Welcome to VibeChat</h3>
          <p className="text-gray-400 text-sm max-w-xs mx-auto">
            Select a chat to start messaging.
          </p>
        </div>
      </div>
    );

  // JSX
  return (
    <div className="flex flex-col h-full overflow-hidden relative backdrop-blur-lg">
      {/* Header */}
      <div className="flex justify-between items-center px-5 py-3 border-b border-[#ffffff20] bg-transparent">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedUser(null)}
            className="md:hidden p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="relative">
            <img
              src={selectedUser?.profilePic || assets.avatar_icon}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
            {!selectedUser?.isGroup && isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#282142]"></div>
            )}
          </div>
          <div>
            <h3 className="font-medium text-white">{selectedUser?.name}</h3>
            <p className="text-xs text-gray-400">
              {selectedUser?.isGroup
                ? `${selectedUser.members.length} members`
                : (isOnline ? "Online" : "Offline")
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          <div className="relative">
            <MoreVertical
              className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            />
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
                {!selectedUser.isGroup && (
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
                )}
                <div className="h-px bg-gray-600 my-1" />
                <button
                  onClick={() => {
                    // logout(); // This might be confusing if it logs out the current user. Maybe just close menu?
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/10 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div
        ref={messageContainerRef}
        className="flex-1 flex flex-col overflow-y-scroll p-3"
      >
        {/* Messages */}
        {messages.map((msg, index) => {
          if (!msg || !msg.senderId) return null;
          return (
            <div
              key={msg._id || index}
              className={`flex items-start gap-2 ${msg.senderId === authUser._id ? "justify-end" : "justify-start"
                } group`}
            >
              {/* Checkbox for Sender (Left side) */}
              {msg.senderId === authUser._id && !msg.isDeleted && (
                <input
                  type="checkbox"
                  checked={selectedMessages.has(msg._id)}
                  onChange={() => toggleMessageSelection(msg._id)}
                  className={`mt-2 w-4 h-4 accent-indigo-500 cursor-pointer ${selectedMessages.size > 0 || selectedMessages.has(msg._id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
                />
              )}

              <div className="text-center text-xs flex flex-col items-center gap-1">
                <img
                  src={
                    msg.senderId === authUser._id
                      ? authUser.profilePic || assets.avatar_icon
                      : (selectedUser.isGroup
                        ? (msg.senderId?.profilePic || assets.avatar_icon) // Need to populate sender in backend for groups
                        : selectedUser.profilePic || assets.avatar_icon)
                  }
                  alt="profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <p className="text-gray-500">{formatMessageTime(msg.createdAt)}</p>
              </div>

              {msg.isDeleted ? (
                <p className="p-2 max-w-[200px] md:text-sm rounded-lg mb-8 text-gray-400 italic border border-gray-700/50 bg-transparent">
                  This message was deleted
                </p>
              ) : (
                msg.image ? (
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
                )
              )}

              {/* Checkbox for Receiver (Right side) */}
              {msg.senderId !== authUser._id && !msg.isDeleted && (
                <input
                  type="checkbox"
                  checked={selectedMessages.has(msg._id)}
                  onChange={() => toggleMessageSelection(msg._id)}
                  className={`mt-2 w-4 h-4 accent-indigo-500 cursor-pointer ${selectedMessages.size > 0 || selectedMessages.has(msg._id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
                />
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
      <div className="flex items-center gap-3 p-3 bg-transparent">
        {authUser.blockedUsers.includes(selectedUser._id) || isBlockedBy ? (
          <div className="w-full text-center p-3 bg-red-500/10 text-red-400 rounded-lg">
            {isBlockedBy
              ? "You have been blocked by this user."
              : "You have blocked this user. Unblock to send messages."}
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-xl">
              <textarea
                ref={textareaRef}
                placeholder="Send a message"
                value={text}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                rows={1}
                className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent resize-none overflow-y-auto min-h-[44px] max-h-[150px]"
              />

              <input
                type="file"
                id="image"
                accept="image/png,image/jpeg"
                hidden
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                    handleSendImage(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="image" className="cursor-pointer text-gray-400 hover:text-white transition-colors">
                <Image className="w-5 h-5" />
              </label>
            </div>
            <button
              onClick={handleSend}
              disabled={!text.trim() && !imageFile}
              className="p-3 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatContainer;
