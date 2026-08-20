const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    // Every task belongs to exactly one registered user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'IN_PROGRESS', 'DONE'],
        message: 'Status must be PENDING, IN_PROGRESS, or DONE',
      },
      default: 'PENDING',
    },
    priority: {
      type: String,
      enum: {
        values: ['LOW', 'MEDIUM', 'HIGH'],
        message: 'Priority must be LOW, MEDIUM, or HIGH',
      },
      default: 'MEDIUM',
    },
    dueDate: {
      type: Date,
    },
    // City or place name used for weather lookups
    location: {
      type: String,
      trim: true,
    },
    // Cloudinary URL for the attached file (if any)
    fileUrl: {
      type: String,
    },
    // Cloudinary public_id — needed if you want to delete the file later
    filePublicId: {
      type: String,
    },
    // Cached weather snapshot taken at creation time
    weather: {
      temp: Number,
      description: String,
      icon: String,
      cityName: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster user-scoped queries
taskSchema.index({ user: 1, createdAt: -1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, priority: 1 });

module.exports = mongoose.model('Task', taskSchema);
