const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Basic socket.io setup
io.on('connection', (socket) => {
  console.log('🔗 Client connected:', socket.id);

  socket.on('joinChat', (rideId) => {
    console.log(`📥 joinChat: ${rideId}`);
    socket.join(`chat_${rideId}`);
  });

  socket.on('leaveChat', (rideId) => {
    console.log(`📤 leaveChat: ${rideId}`);
    socket.leave(`chat_${rideId}`);
  });

  socket.on('sendMessage', (data) => {
    console.log('💬 sendMessage:', data);
    io.to(`chat_${data.rideId}`).emit('newMessage', {
      id: Date.now().toString(),
      text: data.text,
      senderId: data.senderId,
      senderType: data.senderType,
      timestamp: new Date(),
      senderName: data.senderName || 'Unknown'
    });
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// TEMPORARY TEST CODE - Remove after testing
setTimeout(() => {
  console.log('🧪 Sending test message to chat_123...');
  io.to('chat_123').emit('newMessage', {
    id: Date.now().toString(),
    text: 'Hello from driver! This is a test message.',
    senderId: 999,
    senderType: 'driver',
    timestamp: new Date(),
    senderName: 'Driver Test'
  });
}, 5000); // Sends after 5 seconds

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Test backend running on port ${PORT}`);
});
