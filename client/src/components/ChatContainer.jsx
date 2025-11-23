import React, { useContext, useEffect, useRef, useState } from "react";
import assets, { messagesDummyData } from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { AuthContext } from "../context/AuthContext.jsx";
import { FileInput } from "lucide-react";

const ChatContainer = ({ selectedUser, setSelectedUser }) => {
  const scrollEnd = useRef();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // {userId:true}
  const { axios, authUser, socket } = useContext(AuthContext);

  //fetch messages when selected user changes
  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`/api/messages/${selectedUser._id}`);
        if (data.success) {
          setMessages(data.messages);
          //scroll to bottom
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
  }, [selectedUser, axios]);

  //socket listener for incoming new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      //if message belongs to the current chat (either from or to selected user)
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
      //remove after 2s if no other typing event
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

  //auto scroll whenever messages change
  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  //typing emit throttle
  const typingTimeoutRef = useRef(null);
  const emitTyping = () => {
    if (!socket || !selectedUser) return;
    socket.emit("typing", { to: selectedUser._id });
    //throttle stop typing emit
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedUser)
        socket.emit("stop_typing", { to: selectedUser._id });
    }, 1000);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!text.trim() && !document.getElementById("image")?.files?.length)
      return;

    setIsSending(true);

    try {
      const fileInput = document.getElementById("image");
      let imageBase64 = null;
      if (fileInput?.files?.length) {
        const file = fileInput.files[0];
        //read file as base64
        imageBase64 = await new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.onerror = (err) => rej(err);
          reader.readAsDataURL(file);
        });
      }

      //optimistic ui :append local messages first
      const optimistic = {
        _id: `temp-${Date.now()}`,
        senderId: authUser._id,
        receiverId: selectedUser._id,
        text: text.trim() || "",
        image: imageBase64 ? imageBase64 : "",
        createdAt: new Date().toISOString(),
        seen: false,
      };
      setMessages((m) => [...m, optimistic]);
      setText("");
      fileInput && (fileInput.value = "");

      //send to backend
      const payload = {
        text: optimistic.text,
        image: imageBase64,
      };

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        payload
      );

      if (data.success && data.newMessage) {
        //replace temp with server message
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === optimistic._id ? data.newMessage : msg
          )
        );
      } else {
        console.warn("Message ssend failed on server");
      }
    } catch (error) {
      console.error("Send failed", error);
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedUser)
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-indigo-200 bg-white/5 max-md:hidden">
        <img src={assets.logo} alt="" className="max-w-16" />
        <p className="text-lg font-medium text-white">Chat anytime,anywhere</p>
      </div>
    );

  return (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7"
        />
        <img src={assets.help_icon} alt="" className="max-md:hidden max-w-5" />
      </div>

      {/* chat area */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-24">
        {messages.map((msg, index) => (
          <div
            key={msg._id || index}
            className={`flex items-end gap-2 justify-end ${
              msg.senderId === authUser._id ? "justify-end" : "justify-start"
            }`}
          >
            <div className="text-center text-xs">
              <img
                src={
                  msg.senderId === authUser._id
                    ? assets.avatar_icon
                    : selectedUser.profilePic || assets.profile_martin
                }
                alt=""
                className="rounded-full"
              />
              <p className="text-gray-500">
                {formatMessageTime(msg.createdAt)}
              </p>
            </div>

            {msg.image ? (
              //if image is base 64 show it directly ,server will replace it with cloudinary url
              <img
                src={msg.image}
                alt=""
                className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8"
              />
            ) : (
              <p
                className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-indigo-500/30 text-white ${
                  msg.senderId === authUser._id
                    ? "bg-indigo-500/30 text-white"
                    : "bg-gray-700/30 text-white"
                }`}
              >
                {msg.text}
              </p>
            )}
          </div>
        ))}

        {/* typing indicator */}
        {typingUsers[selectedUser._id] && (
          <div className="flex items-center gap-2 ml-2">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse opacity-80"></span>
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse opacity-80 delay-150"></span>
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse opacity-80 delay-300"></span>
            </div>
            <p className="text-xs text-gray-400">typing...</p>
          </div>
        )}

        <div ref={scrollEnd}></div>
      </div>

      {/* bottom area */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-transparent">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            type="text"
            placeholder="Send a message"
            value={text}
            onChange={(e)=>{
              setText(e.target.value);
              emitTyping();
            }}
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input
            type="file"
            id="image"
            accept="image/png , image/jpeg"
            hidden
          />
          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt=""
              className="w-5 mr-2 cursor-pointer"
            />
          </label>
        </div>

        <button onClick={handleSend} disabled={isSending} className="p-2 bg-indigo-600 rounded-full">
          <img src={assets.send_button} alt="" className="w-6" />
        </button>
      </div>
    </div>
  )
};

export default ChatContainer;