const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  serviceDate: {
    type: Date,
    required: [true, 'Service date is required'],
    default: Date.now
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  nextServiceDue: {
    type: Date
  },
  loggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
