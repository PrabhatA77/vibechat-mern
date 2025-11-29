import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import { app, server } from "./lib/socket.js";

import authRoutes from './routes/authRoutes.js';
import messageRouter from "./routes/messageRoutes.js";

app.use(cookieParser());

app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: process.env.FRONTEND_URI,
    credentials: true
}));

import groupRoutes from "./routes/groupRoutes.js";

app.use('/api/status', (req, res) => res.send('Server is Live'));
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRouter);
app.use('/api/groups', groupRoutes);

import { initAIUser } from "./controllers/aiController.js";

// Force restart
await connectDB();
await initAIUser();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("server is running on port:", PORT));
