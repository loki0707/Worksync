const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes         = require('./routes/authRoutes');
const projectRoutes      = require('./routes/projectRoutes');
const taskRoutes         = require('./routes/taskRoutes');
const commentRoutes      = require('./routes/commentRoutes');
const reviewRoutes       = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const activityRoutes     = require('./routes/activityRoutes');
const attachmentRoutes   = require('./routes/attachmentRoutes');
const analyticsRoutes    = require('./routes/analyticsRoutes');
const aiRoutes           = require('./routes/aiRoutes');
const userRoutes         = require('./routes/userRoutes');
const timeRoutes         = require('./routes/timeRoutes');
const leaderboardRoutes  = require('./routes/leaderboardRoutes');
const searchRoutes       = require('./routes/searchRoutes');
const githubRoutes       = require('./routes/githubRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', methods: ['GET','POST','PUT','PATCH','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 200, message: { success: false, message: 'Too many requests' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => { req.io = app.get('io'); next(); });

app.get('/health', (req, res) => res.json({ success: true, message: 'WorkSync API running', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/projects',      projectRoutes);
app.use('/api/notifications', notificationRoutes);

// Project-scoped
app.use('/api/projects/:projectId/tasks',        taskRoutes);
app.use('/api/projects/:projectId/activity',     activityRoutes);
app.use('/api/projects/:projectId/analytics',    analyticsRoutes);
app.use('/api/projects/:projectId/ai',           aiRoutes);
app.use('/api/projects/:projectId/leaderboard',  leaderboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/github', githubRoutes);

// Task-scoped
app.use('/api/projects/:projectId/tasks/:taskId/comments',    commentRoutes);
app.use('/api/projects/:projectId/tasks/:taskId/reviews',     reviewRoutes);
app.use('/api/projects/:projectId/tasks/:taskId/attachments', attachmentRoutes);
app.use('/api/projects/:projectId/tasks/:taskId/time',        timeRoutes);

// User time across project
app.use('/api/projects/:projectId/time', require('./routes/timeRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
