const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isLoggedIn, updateOverdueRequests } = require('../middleware/auth');

router.all('/', updateOverdueRequests, dashboardController.handleDashboardRedirect);
router.all('/dashboard', isLoggedIn, updateOverdueRequests, dashboardController.handleDashboardRedirect);

module.exports = router;
