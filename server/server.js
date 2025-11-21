import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { connectDB } from "./lib/db.js";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";

import authRoutes from './routes/authRoutes.js';
import messageRouter from "./routes/messageRoutes.js";

const app = express();
const server = http.createServer(app);

app.use(cookieParser());

//! initialize socket.io server 
export const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
    }
});


//! store online users
export const userSocketMap = {}; // {userId : socketId};

//! socket.io connection handler
io.on("connection",(socket)=>{
    const userId = socket.handshake.query.userId;
    console.log("User Connected: ",userId);

    if(userId) userSocketMap[userId] = socket.id;

    //! emit online users to all connected clients 
    io.emit('getOnlineUsers',Object.keys(userSocketMap));

    socket.on('disconnect',()=>{
        console.log("user disconnected: ",userId);
        delete userSocketMap[userId];
        io.emit('getOnlineUsers',Object.keys(userSocketMap));
    })
})

app.use(express.json({limit:'10mb'}));
app.use(cors({
    origin: process.env.FRONTEND_URL,   
    credentials: true                 
}));

app.use('/api/status',(req,res)=> res.send('Server is Live'));
app.use('/api/auth',authRoutes);
app.use('/api/messages',messageRouter);

await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("server is running on port:", PORT));
