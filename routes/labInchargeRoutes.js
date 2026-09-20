const express = require('express');
const router = express.Router();
const labInchargeController = require('../controllers/labInchargeController');
const { isLoggedIn, hasRole, updateOverdueRequests } = require('../middleware/auth');

// Protect all lab incharge routes
router.use(isLoggedIn);
router.use(hasRole('lab_incharge'));
router.use(updateOverdueRequests);

// Dashboard & Pending Approvals
router.get('/dashboard', labInchargeController.getDashboard);
router.get('/requests', labInchargeController.getPendingRequests);
router.post('/requests/:id/approve', labInchargeController.postApproveRequest);
router.post('/requests/:id/reject', labInchargeController.postRejectRequest);

// Active Issued Items & Physical Returns
router.get('/issued-items', labInchargeController.getIssuedItems);
router.get('/return/:id', labInchargeController.getReturnForm);
router.post('/return/:id', labInchargeController.postProcessReturn);

module.exports = router;
