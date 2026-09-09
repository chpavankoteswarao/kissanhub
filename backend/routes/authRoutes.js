const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Farmer Auth routes
router.post('/farmer/check-phone', authController.checkFarmerPhone);
router.post('/farmer/login', authController.farmerLogin);

// Buyer Auth routes
router.post('/buyer/check-phone', authController.checkBuyerPhone);
router.post('/buyer/login', authController.buyerLogin);
router.post('/buyer/otp-login', authController.buyerOtpLogin);
router.post('/buyer/create-password', authController.buyerCreatePassword);
router.post('/buyer/reset-password', authController.buyerResetPassword);

// Common OTP verification
router.post('/verify-otp', authController.verifyOtp);

// Admin Auth
router.post('/admin/login', authController.adminLogin);

// Logout
router.post('/logout', authController.logout);

module.exports = router;
