const express = require('express');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');

const router = express.Router();

// All task routes require authentication
router.use(protect);

router.route('/')
  .get(getTasks)
  // uploadSingle handles the "attachment" file field from multipart/form-data
  .post(uploadSingle, createTask);

router.route('/:id')
  .get(getTaskById)
  .put(uploadSingle, updateTask)
  .delete(deleteTask);

module.exports = router;
