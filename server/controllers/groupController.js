import Group from "../models/Group.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const createGroup = async (req, res) => {
    try {
        const { name, description, members } = req.body;
        const profilePic = req.file ? req.file.path : "";
        const userId = req.userId;

        if (!name || !members || members.length === 0) {
            return res.status(400).json({ success: false, message: "Name and members are required" });
        }

        let imageUrl = "";
        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            imageUrl = uploadResponse.secure_url;
        }

        // Parse members if it's a string (from FormData)
        let membersArray = Array.isArray(members) ? members : JSON.parse(members);

        // Add creator to members and admins
        if (!membersArray.includes(userId.toString())) {
            membersArray.push(userId.toString());
        }

        const newGroup = new Group({
            name,
            description,
            members: membersArray,
            admins: [userId],
            profilePic: imageUrl,
            createdBy: userId,
        });

        await newGroup.save();

        // Notify members
        membersArray.forEach(memberId => {
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("newGroup", newGroup);
            }
        });

        res.status(201).json({ success: true, group: newGroup });
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getGroups = async (req, res) => {
    try {
        const userId = req.userId;
        const groups = await Group.find({ members: userId })
            .populate("members", "-password")
            .populate("admins", "-password")
            .sort({ updatedAt: -1 });

        res.json({ success: true, groups });
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await Message.find({ groupId }).sort({ createdAt: 1 });
        res.json({ success: true, messages });
    } catch (error) {
        console.error("Error fetching group messages:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { text } = req.body;
        const { groupId } = req.params;
        const senderId = req.userId;
        let imageUrl = "";

        if (req.file) {
            const uploadResponse = await cloudinary.uploader.upload(req.file.path);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            groupId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        // Emit to all group members
        group.members.forEach(memberId => {
            // Don't emit back to sender if you want, but usually good for consistency
            // or handle on frontend to not duplicate
            const socketId = getReceiverSocketId(memberId);
            if (socketId) {
                io.to(socketId).emit("newGroupMessage", newMessage);
            }
        });

        res.status(201).json({ success: true, newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const deleteGroup = async (req, res) => {
    try {
        const { id } = req.params;
        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ success: false, message: "Group not found" });
        }

        if (!group.admins.includes(req.userId)) {
            return res.status(403).json({ success: false, message: "Only admins can delete the group" });
        }

        await Group.findByIdAndDelete(id);

        // Notify members about group deletion
        group.members.forEach(memberId => {
            const memberSocketId = getReceiverSocketId(memberId);
            if (memberSocketId) {
                io.to(memberSocketId).emit("groupDeleted", id);
            }
        });

        res.status(200).json({ success: true, message: "Group deleted successfully" });
    } catch (error) {
        console.error("Error in deleteGroup: ", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
