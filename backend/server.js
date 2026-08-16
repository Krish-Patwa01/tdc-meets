const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
// In development any origin is allowed so phones on the same wifi can join.
const io = socketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : true,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Simple JSON Database
console.log('✅ JSON Database initialized (no MongoDB needed!)');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/attendees', require('./routes/attendees'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/questions', require('./routes/questions'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-meeting', (data) => {
    socket.join(data.roomId);
    io.to(data.roomId).emit('user-joined', {
      userName: data.userName,
      userId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('receive-message', {
      sender: data.sender,
      message: data.message,
      timestamp: new Date()
    });
  });

  socket.on('raise-hand', (data) => {
    io.to(data.roomId).emit('hand-raised', {
      userName: data.userName,
      userId: socket.id,
      timestamp: new Date()
    });
  });

  socket.on('mute-user', (data) => {
    io.to(data.userId).emit('force-mute', { reason: 'Host muted you' });
  });

  socket.on('kick-user', (data) => {
    io.to(data.userId).emit('kicked-from-meeting', { reason: 'Host removed you' });
    socket.to(data.userId).disconnect();
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, io };
