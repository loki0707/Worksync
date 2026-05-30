require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/database');
const { initializeSocket } = require('./config/socket');
const { checkDeadlines, processRecurringTasks } = require('./services/deadlineService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET','POST'] },
    pingTimeout: 60000, pingInterval: 25000,
  });

  initializeSocket(io);
  app.set('io', io);

  server.listen(PORT, () => {
    console.log(`\n🚀 WorkSync Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health: http://localhost:${PORT}/health\n`);
  });

  // ─── Background jobs ────────────────────────────────────────────────────────
  // Deadline alerts: every hour
  setInterval(() => checkDeadlines(io), 60 * 60 * 1000);
  // Recurring tasks: every 30 minutes
  setInterval(() => processRecurringTasks(), 30 * 60 * 1000);
  // Run once on startup
  checkDeadlines(io);
  processRecurringTasks();

  const shutdown = (sig) => {
    console.log(`\n${sig} received. Shutting down...`);
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => { console.error('Unhandled rejection:', err.message); server.close(() => process.exit(1)); });
};

startServer();
