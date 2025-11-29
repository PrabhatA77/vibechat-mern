import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URI,
        credentials: true,
    },
});

export const getReceiverSocketId = (userId) => {
    return userSocketMap[userId];
}

const userSocketMap = {}; // {userId : socketId};

io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected: ", userId);

    if (userId) userSocketMap[userId] = socket.id;

    // emit online list to all clients
    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    // handle typing , forward to recipient socket id
    socket.on("typing", ({ to }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", { from: userId });
        }
    });

    socket.on("stop_typing", ({ to }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stop_typing", { from: userId });
        }
    });

    socket.on('disconnect', () => {
        console.log("user disconnected: ", userId);
        delete userSocketMap[userId];
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    })
})

export { io, app, server };
