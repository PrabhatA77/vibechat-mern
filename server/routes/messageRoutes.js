import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage, deleteChat, blockUser, unblockUser, deleteSelectedMessages } from "../controllers/messageController.js";
import { upload } from "../middleware/multer.js";

const messageRouter = express.Router();

messageRouter.get('/users', verifyToken, getUsersForSidebar);
messageRouter.get('/:id', verifyToken, getMessages);
messageRouter.put('/mark/:id', verifyToken, markMessageAsSeen);
messageRouter.post('/send/:id', verifyToken, upload.single('image'), sendMessage);
messageRouter.delete('/delete/:id', verifyToken, deleteChat);
messageRouter.put('/block/:id', verifyToken, blockUser);
messageRouter.put('/unblock/:id', verifyToken, unblockUser);
messageRouter.post('/delete-selected', verifyToken, deleteSelectedMessages);

export default messageRouter;