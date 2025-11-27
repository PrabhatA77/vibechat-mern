import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import { User } from "../models/User.js";
import { io, userSocketMap } from "../server.js";

//!get users list others then logged in user
export const getUsersForSidebar = async (req, res) => {
    try {
        const userId = req.userId ? req.userId : req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const filteredUsers = await User.find({ _id: { $ne: userId } }).select("-password");

        //count number of messages not seen 
        const unseenMessages = {};
        const promises = filteredUsers.map(async (user) => {
            const messages = await Message.find({ senderId: user._id, receiverId: userId, seen: false })
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })

        await Promise.all(promises);
        res.json({ success: true, users: filteredUsers, unseenMessages })
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//! get all messages for selected user
export const getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.userId ? req.userId : req.user?._id;
        if (!myId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        })
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });

        res.json({ success: true, messages });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//! api to mark message as seen using message id
export const markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await Message.findByIdAndUpdate(
            id,
            { seen: true },
            { new: true }
        );

        if (!message) {
            return res.json({ success: false, message: "Message not found" });
        }

        res.json({ success: true, message });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//! send message to a selected user
export const sendMessage = async (req, res) => {
    try {

        const { text, image } = req.body;
        const receiverId = req.params.id;
        const senderId = req.userId ? req.userId : req.user?._id;
        if (!senderId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        // Check if sender has blocked receiver or vice versa
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
            return res.status(404).json({ success: false, message: "Sender or receiver not found" });
        }

        if (sender.blockedUsers.includes(receiverId)) {
            return res.status(403).json({ success: false, message: "You have blocked this user and cannot send messages." });
        }

        if (receiver.blockedUsers.includes(senderId)) {
            return res.status(403).json({ success: false, message: "You have been blocked by this user and cannot send messages." });
        }

        if (!text && !image && !req.file) {
            return res.json({
                success: false,
                message: "Message must contain text or image"
            });
        }

        let imageUrl = "";

        if (req.file) {
            const uploadResponse = await cloudinary.uploader.upload(req.file.path);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = await Message.create({ senderId, receiverId, text, image: imageUrl });

        //! emit the new message to the receiver socket
        const receiverSocketId = userSocketMap[receiverId];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('newMessage', newMessage);
        }

        // AI BOT LOGIC
        if (receiver.isAI) {
            import("../controllers/aiController.js").then(async ({ getOpenAIResponse }) => {
                const aiResponseText = await getOpenAIResponse(text, imageUrl);

                const aiMessage = await Message.create({
                    senderId: receiverId, // AI is sender
                    receiverId: senderId, // User is receiver
                    text: aiResponseText,
                    image: ""
                });

                // Emit AI response back to user
                const userSocket = userSocketMap[senderId];
                if (userSocket) {
                    io.to(userSocket).emit('newMessage', aiMessage);
                }
            });
        }

        res.json({ success: true, newMessage })

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message })
    }
}

//! delete all messages between two users
export const deleteChat = async (req, res) => {
    try {
        const { id: otherUserId } = req.params;
        const myId = req.userId ? req.userId : req.user?._id;

        if (!myId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        await Message.deleteMany({
            $or: [
                { senderId: myId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: myId },
            ]
        });

        res.json({ success: true, message: "Chat deleted successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

//! block a user
export const blockUser = async (req, res) => {
    try {
        const { id: blockId } = req.params;
        const myId = req.userId ? req.userId : req.user?._id;

        if (!myId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        await User.findByIdAndUpdate(myId, {
            $addToSet: { blockedUsers: blockId }
        });

        // Emit socket event to the blocked user
        const blockedUserSocketId = userSocketMap[blockId];
        if (blockedUserSocketId) {
            io.to(blockedUserSocketId).emit("userBlocked", { blockerId: myId });
        }

        res.json({ success: true, message: "User blocked successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

//! unblock a user
export const unblockUser = async (req, res) => {
    try {
        const { id: blockId } = req.params;
        const myId = req.userId ? req.userId : req.user?._id;

        if (!myId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        await User.findByIdAndUpdate(myId, {
            $pull: { blockedUsers: blockId }
        });

        // Emit socket event to the unblocked user
        const unblockedUserSocketId = userSocketMap[blockId];
        if (unblockedUserSocketId) {
            io.to(unblockedUserSocketId).emit("userUnblocked", { blockerId: myId });
        }

        res.json({ success: true, message: "User unblocked successfully" });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};