import express from "express";
import { createGroup, getGroups, getGroupMessages, sendGroupMessage, deleteGroup } from "../controllers/groupController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { upload } from "../middleware/multer.js";

const router = express.Router();

router.post("/create", verifyToken, upload.single("profilePic"), createGroup);
router.get("/", verifyToken, getGroups);
router.get("/:groupId/messages", verifyToken, getGroupMessages);
router.post("/:groupId/messages", verifyToken, upload.single("image"), sendGroupMessage);
router.delete("/:id", verifyToken, deleteGroup);

export default router;
