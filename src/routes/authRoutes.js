const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

const passwordController = require('../controllers/passwordController');

router.post('/login', authController.login);
router.post('/register', userController.register);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', verifyToken, userController.getMe);

// Forgot Password
router.post('/forgot-password', passwordController.forgotPassword);
router.post('/verify-otp', passwordController.verifyOtpOnly);
router.post('/reset-password', passwordController.resetPassword);

// Profile
router.put('/users/update-profile/:id', verifyToken, userController.updateProfile);
router.put('/users/change-password/:id', verifyToken, userController.changePassword);

module.exports = router;
