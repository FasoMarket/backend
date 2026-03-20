const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  content:        { type: String, required: true },
  target:         { type: String, enum: ['all', 'customers', 'vendors'], default: 'all' },
  channels:       [{ type: String, enum: ['notification', 'email'] }],
  sentAt:         { type: Date, default: null },
  sentBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipientCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);
