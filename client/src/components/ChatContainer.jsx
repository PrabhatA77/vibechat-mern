import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { AuthContext } from "../context/AuthContext.jsx";
import ImageUploadProgress from "../components/ImageUploadProgress.jsx";


const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const scrollEnd = useRef();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const { axios, authUser, socket } = useContext(AuthContext);

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
            () => scrollEnd.current?.scrollIntoView({ behavior: "smooth" }),
            50
          );
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
      }
    };
    fetchMessages();
  }, [selectedUser._id, axios]);

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
          () => scrollEnd.current?.scrollIntoView({ behavior: "smooth" }),
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

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
    };
  }, [socket, selectedUser]);

  // Auto scroll
  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Typing emit
  const typingTimeoutRef = useRef(null);
  const emitTyping = () => {
    if (!socket || !selectedUser) return;
    socket.emit("typing", { to: selectedUser._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { to: selectedUser._id });
    }, 1000);
  };

  // ⭐ SEND TEXT MESSAGE
  const handleSend = async (e) => {
    e.preventDefault();

    // If image selected → use image upload flow
    if (imageFile) {
      handleSendImage();
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

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === tempMsg._id ? data.newMessage : msg
        )
      );
    } catch (error) {
      console.error(error);
    }

    setText("");
  };

  // ⭐ SEND IMAGE WITH PROGRESS
  const handleSendImage = async () => {
  if (!imageFile) return;

  setUploadingImage(imageFile);

  // Preview bubble
  const preview = URL.createObjectURL(imageFile);
  const tempMsg = {
    _id: `upload-${Date.now()}`,
    senderId: authUser._id,
    receiverId: selectedUser._id,
    text: "",
    image: preview,
    temp: true,
  };
  setMessages((prev) => [...prev, tempMsg]);

  // Multipart upload
  const formData = new FormData();
  formData.append("image", imageFile);
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
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === tempMsg._id ? data.newMessage : msg
      )
    );

  } catch (error) {
    console.error(error);
  }

  // Reset uploading state
  setUploadingImage(null);
  setUploadProgress(0);
  setImageFile(null);
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
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 h-8 rounded-full object-cover"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
        </p>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-24">



        {/* Messages */}
        {messages.map((msg, index) => {
          if (!msg || !msg.senderId) return null;
          return (
            <div
              key={msg._id || index}
              className={`flex items-end gap-2 ${msg.senderId === authUser._id ? "justify-end" : "justify-start"
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
                  className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all ${msg.senderId === authUser._id
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
        {uploadingImage && uploadProgress < 100 && (
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

        <div ref={scrollEnd}></div>
      </div>

      {/* Bottom Area */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-transparent">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            type="text"
            placeholder="Send a message"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              emitTyping();
            }}
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />

          <input
            type="file"
            id="image"
            accept="image/png,image/jpeg"
            hidden
            onChange={(e) => {
              setImageFile(e.target.files[0]);
              setUploadingImage(e.target.files[0]); // Start progress bubble
            }}
          />

          <label htmlFor="image">
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
      </div>
    </div>
  );
};

export default ChatContainer;
