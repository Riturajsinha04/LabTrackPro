const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isLoggedIn, updateOverdueRequests } = require('../middleware/auth');

router.get('/', updateOverdueRequests, dashboardController.handleDashboardRedirect);
router.get('/dashboard', isLoggedIn, updateOverdueRequests, dashboardController.handleDashboardRedirect);

module.exports = router;
