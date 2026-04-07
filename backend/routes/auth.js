const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, authController.getProfile);

// @route   GET api/auth/network
// @desc    Get nearby network
// @access  Public (for demo)
router.get('/network', authController.getNetwork);

// @route   POST api/auth/payment
// @desc    Process a mock payment
// @access  Public
router.post('/payment', authController.makePayment);

// @route   GET api/auth/receipts
// @desc    Get mock receipts
// @access  Public
router.get('/receipts', authController.getReceipts);

module.exports = router;
