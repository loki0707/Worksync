import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('🔌 Socket connected'));
  socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const joinProject = (projectId) => {
  if (socket) socket.emit('join_project', projectId);
};

export const leaveProject = (projectId) => {
  if (socket) socket.emit('leave_project', projectId);
};
