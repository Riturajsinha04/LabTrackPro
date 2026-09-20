const express = require('express');
const router = express.Router();
const requesterController = require('../controllers/requesterController');
const { isLoggedIn, hasRole, updateOverdueRequests } = require('../middleware/auth');
const { validateIssueRequest } = require('../middleware/validators');

// Protect requester routes
router.use(isLoggedIn);
router.use(hasRole('requester', 'admin', 'lab_incharge')); // Admin and Lab In-charge can also browse if needed
router.use(updateOverdueRequests);

// Browse Assets & Submit Request
router.all('/browse', requesterController.getBrowseAssets);
router.get('/request/:assetId', requesterController.getRequestForm);
router.post('/request/:assetId', validateIssueRequest, requesterController.postSubmitRequest);

// Personal Request History
router.all('/my-requests', requesterController.getMyRequests);

module.exports = router;
