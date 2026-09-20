const { body } = require('express-validator');

// Register validation
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['admin', 'lab_incharge', 'requester'])
    .withMessage('Invalid user role selected'),
  body('assignedLab')
    .custom((value, { req }) => {
      if (req.body.role === 'lab_incharge' && (!value || value.trim() === '')) {
        throw new Error('Assigned lab location is required for Lab In-charge role');
      }
      return true;
    })
];

// Login validation
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Asset validation
const validateAsset = [
  body('assetTag')
    .trim()
    .notEmpty()
    .withMessage('Asset Tag is required'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Asset Name is required'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('labLocation')
    .trim()
    .notEmpty()
    .withMessage('Lab Location is required'),
  body('totalQuantity')
    .isInt({ min: 0 })
    .withMessage('Total quantity must be a non-negative integer'),
  body('availableQuantity')
    .isInt({ min: 0 })
    .withMessage('Available quantity must be a non-negative integer')
    .custom((value, { req }) => {
      if (parseInt(value, 10) > parseInt(req.body.totalQuantity, 10)) {
        throw new Error('Available quantity cannot exceed Total quantity');
      }
      return true;
    }),
  body('condition')
    .isIn(['OK', 'Damaged', 'Lost'])
    .withMessage('Invalid condition')
];

// Request validation
const validateIssueRequest = [
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('purpose')
    .trim()
    .notEmpty()
    .withMessage('Purpose is required'),
  body('expectedReturnDate')
    .isISO8601()
    .withMessage('Valid expected return date is required')
    .custom((value) => {
      const returnDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (returnDate < today) {
        throw new Error('Expected return date must be today or in the future');
      }
      return true;
    })
];

// Maintenance log validation
const validateMaintenance = [
  body('serviceDate')
    .isISO8601()
    .withMessage('Valid service date is required'),
  body('cost')
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),
  body('notes')
    .trim()
    .notEmpty()
    .withMessage('Maintenance notes are required')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateAsset,
  validateIssueRequest,
  validateMaintenance
};
