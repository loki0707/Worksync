/**
 * Socket.IO Configuration
 * Manages real-time connections, rooms per project, and event broadcasting
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Store active socket connections: userId -> socketId
const activeUsers = new Map();

const initializeSocket = (io) => {

  // Middleware: authenticate socket connections using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);
    activeUsers.set(socket.user._id.toString(), socket.id);

    // Join a project room to receive project-specific events
    socket.on('join_project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`👥 ${socket.user.name} joined project room: ${projectId}`);
    });

    // Leave a project room
    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Join personal room for direct notifications
    socket.join(`user:${socket.user._id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.user.name}`);
      activeUsers.delete(socket.user._id.toString());
    });
  });

  return io;
};

/**
 * Emit a task update event to all users in a project room
 */
const emitTaskUpdate = (io, projectId, event, data) => {
  io.to(`project:${projectId}`).emit(event, data);
};

/**
 * Emit a notification to a specific user
 */
const emitNotification = (io, userId, notification) => {
  io.to(`user:${userId}`).emit('notification', notification);
};

/**
 * Emit a comment event to all users in a project room
 */
const emitComment = (io, projectId, data) => {
  io.to(`project:${projectId}`).emit('new_comment', data);
};

module.exports = {
  initializeSocket,
  emitTaskUpdate,
  emitNotification,
  emitComment,
  activeUsers,
};
