const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register' , userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/logout', userController.logoutUser);
router.post('/forget-password', userController.forgetPassword);
router.post('/reset-password', userController.resetPassword);
router.post("/google-signin", userController.googleSignIn);
router.post('/isUserRegistered', userController.isUserRegistered);
router.get('/userDetailsToProfile/:userId', userController.userDetailsToProfile);

// Protected route
router.get('/getme', protect, userController.getMe);

module.exports = router;
