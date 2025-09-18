import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';

// Socket authentication middleware
export const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error'));
  }
};

// Handle socket connections
export const handleConnection = (socket) => {
  console.log(`User ${socket.user.name} connected: ${socket.id}`);

  // Join poll room to receive real-time updates
  socket.on('joinPoll', (pollId) => {
    socket.join(`poll-${pollId}`);
    console.log(`User ${socket.user.name} joined poll room: poll-${pollId}`);
  });

  // Leave poll room
  socket.on('leavePoll', (pollId) => {
    socket.leave(`poll-${pollId}`);
    console.log(`User ${socket.user.name} left poll room: poll-${pollId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} disconnected: ${socket.id}`);
  });

  // Send welcome message
  socket.emit('connected', {
    message: 'Connected to real-time polling server',
    user: socket.user
  });
};

// Get online users in a poll room
export const getOnlineUsersInPoll = (io, pollId) => {
  const room = io.sockets.adapter.rooms.get(`poll-${pollId}`);
  return room ? room.size : 0;
};