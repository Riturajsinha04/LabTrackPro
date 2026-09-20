const mongoose = require('mongoose');

const issueRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    trim: true
  },
  expectedReturnDate: {
    type: Date,
    required: [true, 'Expected return date is required']
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Issued', 'Returned', 'Overdue'],
    default: 'Pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  issueDate: {
    type: Date
  },
  actualReturnDate: {
    type: Date
  },
  conditionOnReturn: {
    type: String,
    enum: ['OK', 'Damaged', 'Lost', null],
    default: null
  },
  rejectionRemark: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('IssueRequest', issueRequestSchema);
