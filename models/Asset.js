const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetTag: {
    type: String,
    required: [true, 'Asset tag is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Asset name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  labLocation: {
    type: String,
    required: [true, 'Lab location is required'],
    trim: true
  },
  totalQuantity: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: [0, 'Total quantity cannot be negative']
  },
  availableQuantity: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Available quantity cannot be negative'],
    validate: {
      validator: function(val) {
        return val <= this.totalQuantity;
      },
      message: 'Available quantity cannot exceed total quantity'
    }
  },
  condition: {
    type: String,
    enum: ['OK', 'Damaged', 'Lost'],
    default: 'OK'
  },
  description: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Asset', assetSchema);
