const mongoose = require('mongoose');

const communicationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['announcement', 'promotion', 'maintenance', 'alert'],
      default: 'announcement'
    },
    visibility: {
      type: String,
      enum: ['public', 'customers', 'vendors', 'admin'],
      default: 'public'
    },
    targetRole: {
      type: String,
      enum: ['customer', 'vendor', 'admin', 'all'],
      default: 'customer'
    },
    imageUrl: {
      type: String,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Communication', communicationSchema);
