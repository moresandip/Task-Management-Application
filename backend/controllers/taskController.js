const Task = require('../models/Task');
const { getWeatherByCity } = require('../utils/weatherService');
const { sendTaskCreatedEmail, sendTaskCompletedEmail } = require('../utils/emailService');

// ── GET /api/tasks ────────────────────────────────────────────────────────────

/**
 * @desc    Get all tasks for the logged-in user with optional filtering & pagination
 * @route   GET /api/tasks
 * @access  Private
 *
 * Query params:
 *   page       - Page number (default: 1)
 *   limit      - Items per page (default: 9)
 *   status     - Filter by PENDING | IN_PROGRESS | DONE
 *   priority   - Filter by LOW | MEDIUM | HIGH
 *   search     - Full-text search on title and description
 *   startDate  - dueDate >= startDate
 *   endDate    - dueDate <= endDate
 *   sortBy     - Field to sort by (default: createdAt)
 *   order      - asc | desc (default: desc)
 */
const getTasks = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 9,
      status,
      priority,
      search,
      startDate,
      endDate,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Always scope to the authenticated user — users can never see each other's tasks
    const filter = { user: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      filter.dueDate = {};
      if (startDate) filter.dueDate.$gte = new Date(startDate);
      if (endDate) filter.dueDate.$lte = new Date(endDate);
    }

    const numericPage = Math.max(1, Number(page));
    const numericLimit = Math.min(50, Math.max(1, Number(limit)));
    const skip = (numericPage - 1) * numericLimit;

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sortOptions).skip(skip).limit(numericLimit),
      Task.countDocuments(filter),
    ]);

    res.json({
      data: tasks,
      meta: {
        total,
        page: numericPage,
        limit: numericLimit,
        lastPage: Math.ceil(total / numericLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/tasks/:id ────────────────────────────────────────────────────────

/**
 * @desc    Get a single task by ID (must belong to logged-in user)
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
};

// ── POST /api/tasks ───────────────────────────────────────────────────────────

/**
 * @desc    Create a new task
 * @route   POST /api/tasks
 * @access  Private
 *
 * Supports multipart/form-data for file attachments.
 * After saving, it fetches live weather for the location and sends a confirmation email.
 */
const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate, location } = req.body;

    if (!title) {
      res.status(400);
      throw new Error('Task title is required');
    }

    // If a file was uploaded, multer-storage-cloudinary populates req.file
    const fileUrl = req.file?.path || undefined;
    const filePublicId = req.file?.filename || undefined;

    // Fetch weather snapshot for the task's location (non-blocking if it fails)
    const weather = location ? await getWeatherByCity(location) : null;

    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      status: status || 'PENDING',
      priority: priority || 'MEDIUM',
      dueDate: dueDate || undefined,
      location,
      fileUrl,
      filePublicId,
      weather,
    });

    // Send a confirmation email asynchronously — failure should not block the response
    sendTaskCreatedEmail(req.user.email, req.user.name, task).catch((err) => {
      console.error('Failed to send task creation email:', err.message);
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/tasks/:id ────────────────────────────────────────────────────────

/**
 * @desc    Update an existing task
 * @route   PUT /api/tasks/:id
 * @access  Private
 *
 * If the task status is changed to DONE, a completion notification email is sent.
 * A new file upload replaces the old attachment URL.
 */
const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    const { title, description, status, priority, dueDate, location } = req.body;

    // Track the old status to detect a transition to DONE
    const wasAlreadyDone = task.status === 'DONE';

    // Apply updates — only overwrite fields that were actually sent
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;

    // If location changed, refresh the cached weather snapshot
    if (location !== undefined && location !== task.location) {
      task.location = location;
      task.weather = location ? await getWeatherByCity(location) : null;
    }

    // Replace attachment if a new file was uploaded
    if (req.file) {
      task.fileUrl = req.file.path;
      task.filePublicId = req.file.filename;
    }

    const updatedTask = await task.save();

    // Send a completion email if this update just changed the status to DONE
    if (!wasAlreadyDone && updatedTask.status === 'DONE') {
      sendTaskCompletedEmail(req.user.email, req.user.name, updatedTask).catch((err) => {
        console.error('Failed to send task completion email:', err.message);
      });
    }

    res.json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────

/**
 * @desc    Delete a task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    res.json({ message: 'Task deleted successfully', taskId: req.params.id });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/tasks/seed ────────────────────────────────────────────────────────

/**
 * @desc    Seed sample demo tasks for the authenticated user
 * @route   POST /api/tasks/seed
 * @access  Private
 */
const seedSampleTasksForUser = async (userId) => {
  const sampleTasks = [
    {
      user: userId,
      title: 'Design Mobile App UI & Wireframes',
      description: 'Review color palette, create high-fidelity Figma components, and finalize responsive navigation layout.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      location: 'Mumbai',
      weather: { temp: 29, description: 'clear sky', icon: '01d', cityName: 'Mumbai' },
    },
    {
      user: userId,
      title: 'Setup MongoDB Atlas Cluster & API Endpoints',
      description: 'Configure database indexes, connect Mongoose models, and test CRUD endpoints.',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: new Date(),
      location: 'Pune',
      weather: { temp: 26, description: 'scattered clouds', icon: '03d', cityName: 'Pune' },
    },
    {
      user: userId,
      title: 'Prepare Quarterly Sprint & Requirement Presentation',
      description: 'Draft sprint progress report, document backlog items, and prepare presentation deck for stakeholder review.',
      status: 'PENDING',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: 'Delhi',
      weather: { temp: 32, description: 'haze', icon: '50d', cityName: 'Delhi' },
    },
    {
      user: userId,
      title: 'Finalize Cloudinary File Upload Integration',
      description: 'Implement multer multipart storage handler, test file upload constraints and attachment links.',
      status: 'IN_PROGRESS',
      priority: 'LOW',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      location: 'Bangalore',
      weather: { temp: 24, description: 'light rain', icon: '10d', cityName: 'Bangalore' },
    },
  ];

  return await Task.insertMany(sampleTasks);
};

const seedTasks = async (req, res, next) => {
  try {
    const tasks = await seedSampleTasksForUser(req.user._id);
    res.status(201).json({
      message: 'Sample tasks created successfully',
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  seedTasks,
  seedSampleTasksForUser,
};
