const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      required: true
    },
    Description: {
      type: String,
      required: true
    },
    Category: {
      type: String,
      enum: ['Assignment', 'Thesis', 'Report'],
      required: true
    },
    FilePath: {
      type: String,
      required: true
    },
    FileName: {
      type: String,
      required: true
    },
    FileSize: {
      type: Number,
      required: true
    },
    Status: {
      type: String,
      enum: ['draft', 'submitted', 'reviewed', 'approved', 'rejected'],
      default: 'draft'
    },
    StudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true
    },
    StudentEmail: {
      type: String,
      required: true
    },
    Reviewer: {
      type: String,
      default: "Not Appointed yet"
    }
  },
  {
    timestamps: {
      createdAt: 'SubmittedAt',
      updatedAt: 'UpdatedAt'
    }
  }
);

const Assignment = mongoose.model('assignments', assignmentSchema);
module.exports = Assignment;
