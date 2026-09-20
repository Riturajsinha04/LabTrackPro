const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isLoggedIn, hasRole, updateOverdueRequests } = require('../middleware/auth');
const { validateAsset, validateMaintenance } = require('../middleware/validators');

// Protect all admin routes
router.use(isLoggedIn);
router.use(hasRole('admin'));
router.use(updateOverdueRequests);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Asset Management CRUD
router.get('/assets', adminController.getAssets);
router.get('/assets/new', adminController.getNewAsset);
router.post('/assets', validateAsset, adminController.postCreateAsset);
router.get('/assets/:id/edit', adminController.getEditAsset);
router.put('/assets/:id', validateAsset, adminController.putUpdateAsset);
router.delete('/assets/:id', adminController.deleteAsset);

// User Management
router.get('/users', adminController.getUsers);
router.post('/users/:id/role', adminController.postUpdateUserRole);

// Maintenance Logs
router.get('/assets/:id/maintenance', adminController.getMaintenanceLogs);
router.post('/assets/:id/maintenance', validateMaintenance, adminController.postAddMaintenanceLog);

module.exports = router;
