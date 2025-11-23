import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import { User } from "../models/User.js";
import { io,userSocketMap } from "../server.js";

//!get users list others then logged in user
export const getUsersForSidebar = async (req,res)=>{
    try {
        const userId = req.userId ? req.userId : req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
        const filteredUsers = await User.find({_id:{$ne:userId}}).select("-password");

        //count number of messages not seen 
        const unseenMessages = {};
        const promises = filteredUsers.map(async (user)=>{
            const messages = await Message.find({senderId:user._id , receiverId:userId, seen:false})
            if(messages.length>0){
                unseenMessages[user._id] = messages.length;
            }
        })

        await Promise.all(promises);
        res.json({success:true,users:filteredUsers,unseenMessages})
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}

//! get all messages for selected user
export const getMessages = async (req,res)=>{
    try {
        const {id:selectedUserId} = req.params;
        const myId = req.userId ? req.userId : req.user?._id;
    if (!myId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

        const messages = await Message.find({
            $or:[
                {senderId:myId,receiverId:selectedUserId},
                {senderId:selectedUserId,receiverId:myId},
            ]
        })
        await Message.updateMany({senderId:selectedUserId,receiverId:myId},{seen:true});

        res.json({ success: true, messages });
    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}

//! api to mark message as seen using message id
export const markMessageAsSeen = async (req,res)=>{
    try {
        const {id} = req.params;

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
        res.json({success:false,message:error.message})
    }
}

//! send message to a selected user
export const sendMessage = async (req,res)=>{
    try {
        
        const {text,image} = req.body;
        const receiverId = req.params.id;
        const senderId = req.userId ? req.userId : req.user?._id;
    if (!senderId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

        if (!text && !image) {
            return res.json({
                success: false,
                message: "Message must contain text or image"
            });
        }

        let imageUrl="";
        
        if (image) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(image);
                imageUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.log("Cloudinary Error:", uploadError.message);
                return res.json({
                    success: false,
                    message: "Failed to upload image"
                });
            }
        }

        const newMessage = await Message.create({senderId,receiverId,text,image:imageUrl});

        //! emit the new message to the receiver socket
        const receiverSocketId = userSocketMap[receiverId];
        if(receiverSocketId){
            io.to(receiverSocketId).emit('newMessage',newMessage);
        }

        res.json({success:true,newMessage})

    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}