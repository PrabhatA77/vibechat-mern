import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { getMessages, getUsersForSidebar, markMessageAsSeen, sendMessage } from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get('/users',verifyToken,getUsersForSidebar);
messageRouter.get('/:id',verifyToken,getMessages);
messageRouter.get('mark/:id',verifyToken,markMessageAsSeen);
messageRouter.get('/send/:id',verifyToken,sendMessage);

export default messageRouter;