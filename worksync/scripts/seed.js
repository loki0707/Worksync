/**
 * scripts/seed.js
 * ─────────────────────────────────────────────────────────────────
 * Seeds MongoDB Atlas with sample WorkSync data so you can start
 * testing immediately after connecting.
 *
 * Run:  node scripts/seed.js
 * Clear: node scripts/seed.js --clear
 */
require('dotenv').config();
const mongoose = require('mongoose');

const User          = require('../models/User');
const Project       = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Task          = require('../models/Task');
const Comment       = require('../models/Comment');

const CLEAR_ONLY = process.argv.includes('--clear');

async function clearDB() {
  await Promise.all([
    User.deleteMany({}),
    Project.deleteMany({}),
    ProjectMember.deleteMany({}),
    Task.deleteMany({}),
    Comment.deleteMany({}),
  ]);
  console.log('✅  All collections cleared');
}

async function seed() {
  // ── 1. Users ──────────────────────────────────────────────────────────────
  console.log('Creating users...');

  const admin = await User.create({
    name:     'Nanthini Admin',
    email:    'admin@worksync.dev',
    password: 'password123',
    bio:      'Project admin and team lead',
  });

  const developer = await User.create({
    name:     'Alex Developer',
    email:    'dev@worksync.dev',
    password: 'password123',
    bio:      'Full-stack developer',
  });

  const reviewer = await User.create({
    name:     'Sam Reviewer',
    email:    'reviewer@worksync.dev',
    password: 'password123',
    bio:      'Senior reviewer and architect',
  });

  console.log('  ✓ 3 users created');

  // ── 2. Project ────────────────────────────────────────────────────────────
  console.log('Creating project...');

  const project = await Project.create({
    name:        'WorkSync Platform',
    key:         'WS',
    description: 'Main platform development project',
    owner:       admin._id,
    status:      'ACTIVE',
    githubRepo:  'https://github.com/your-org/worksync',
  });

  console.log('  ✓ Project created');

  // ── 3. Project Members ────────────────────────────────────────────────────
  console.log('Adding team members...');

  await ProjectMember.insertMany([
    { project: project._id, user: admin._id,     role: 'ADMIN',     invitedBy: admin._id },
    { project: project._id, user: developer._id, role: 'DEVELOPER', invitedBy: admin._id },
    { project: project._id, user: reviewer._id,  role: 'REVIEWER',  invitedBy: admin._id },
  ]);

  console.log('  ✓ 3 members added (ADMIN, DEVELOPER, REVIEWER)');

  // ── 4. Tasks ──────────────────────────────────────────────────────────────
  console.log('Creating tasks...');

  const tasks = await Task.insertMany([
    {
      title:       'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for automated testing and deployment',
      project:     project._id,
      taskNumber:  1,
      status:      'DONE',
      priority:    'HIGH',
      reporter:    admin._id,
      assignee:    developer._id,
      githubPR:    'https://github.com/your-org/worksync/pull/1',
      statusHistory: [
        { from: 'TODO', to: 'IN_PROGRESS', changedBy: developer._id },
        { from: 'IN_PROGRESS', to: 'REVIEW', changedBy: developer._id },
        { from: 'REVIEW', to: 'DONE', changedBy: reviewer._id },
      ],
    },
    {
      title:       'Implement JWT authentication',
      description: 'Add login, register, and token refresh endpoints with bcrypt password hashing',
      project:     project._id,
      taskNumber:  2,
      status:      'IN_PROGRESS',
      priority:    'HIGH',
      reporter:    admin._id,
      assignee:    developer._id,
      dueDate:     new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
    {
      title:       'Design Kanban board UI',
      description: 'Create drag-and-drop kanban board with status columns: TODO, IN_PROGRESS, REVIEW, DONE',
      project:     project._id,
      taskNumber:  3,
      status:      'REVIEW',
      priority:    'MEDIUM',
      reporter:    admin._id,
      assignee:    developer._id,
      githubPR:    'https://github.com/your-org/worksync/pull/3',
      statusHistory: [
        { from: 'TODO', to: 'IN_PROGRESS', changedBy: developer._id },
        { from: 'IN_PROGRESS', to: 'REVIEW', changedBy: developer._id },
      ],
    },
    {
      title:       'Write API documentation',
      description: 'Document all REST endpoints with request/response examples',
      project:     project._id,
      taskNumber:  4,
      status:      'TODO',
      priority:    'LOW',
      reporter:    admin._id,
      dueDate:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
    {
      title:       'Add real-time notifications with Socket.IO',
      description: 'Notify team members when tasks are assigned, reviewed, or completed',
      project:     project._id,
      taskNumber:  5,
      status:      'TODO',
      priority:    'MEDIUM',
      reporter:    admin._id,
      assignee:    developer._id,
      isPinned:    true,
    },
    {
      title:       'Overdue task example',
      description: 'This task is past its due date to demonstrate the overdue highlight feature',
      project:     project._id,
      taskNumber:  6,
      status:      'IN_PROGRESS',
      priority:    'HIGH',
      reporter:    admin._id,
      assignee:    developer._id,
      dueDate:     new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days PAST
    },
  ]);

  console.log(`  ✓ ${tasks.length} tasks created`);

  // ── 5. Comments ───────────────────────────────────────────────────────────
  console.log('Adding comments...');

  await Comment.insertMany([
    {
      task:    tasks[1]._id,  // JWT auth task
      author:  reviewer._id,
      content: 'Make sure to implement refresh token rotation for security.',
    },
    {
      task:    tasks[1]._id,
      author:  developer._id,
      content: 'Good point — I will add a refresh token blacklist using Redis.',
    },
    {
      task:    tasks[2]._id,  // Kanban task (in review)
      author:  reviewer._id,
      content: 'The drag-and-drop animations look smooth. Need to test on mobile.',
    },
  ]);

  console.log('  ✓ 3 comments added');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Seed complete! Login with:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('  ADMIN     →  admin@worksync.dev     / password123');
  console.log('  DEVELOPER →  dev@worksync.dev       / password123');
  console.log('  REVIEWER  →  reviewer@worksync.dev  / password123');
  console.log('');
  console.log('  All 3 accounts belong to the "WorkSync Platform" project.');
  console.log('');
}

// ── Main ─────────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('\n✅  Connected to Atlas\n');
    await clearDB();
    if (!CLEAR_ONLY) await seed();
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌  Cannot connect to Atlas: ' + err.message);
    console.error('    Run  node scripts/testConnection.js  to diagnose\n');
    process.exit(1);
  });
