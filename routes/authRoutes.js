const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validators');

router.get('/login', authController.getLogin);
router.post('/login', validateLogin, authController.postLogin);

router.get('/register', authController.getRegister);
router.post('/register', validateRegister, authController.postRegister);

router.post('/logout', authController.logout);
router.get('/logout', authController.logout);

module.exports = router;
