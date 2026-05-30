const express = require('express');
const router  = express.Router({ mergeParams: true });
const {
  createTask, getTasks, getTask, updateTask,
  updateTaskStatus, deleteTask, restoreTask, getVersionHistory,
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const {
  requireProjectMember, requireDeveloper,
} = require('../middleware/authorization');
const { createTaskValidator, updateTaskValidator } = require('../middleware/validation');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success:false, message:errors.array().map(e=>e.msg).join(', ') });
  next();
};

router.use(protect, requireProjectMember);

// GET: all roles can list/view tasks
router.get('/',          getTasks);
router.get('/:taskId',   getTask);
router.get('/:taskId/versions', getVersionHistory);

// WRITE: only ADMIN and DEVELOPER can create/update/delete
router.post('/', requireDeveloper, createTaskValidator, createTask);
router.put( '/:taskId', requireDeveloper, updateTaskValidator, updateTask);
router.delete('/:taskId', requireDeveloper, deleteTask);
router.patch('/:taskId/restore', requireDeveloper, restoreTask);

// Status change: ADMIN + DEVELOPER (REVIEWER uses review flow instead)
router.patch(
  '/:taskId/status',
  requireDeveloper,
  [body('status').isIn(['TODO','IN_PROGRESS','REVIEW','DONE'])],
  validate,
  updateTaskStatus
);

module.exports = router;
