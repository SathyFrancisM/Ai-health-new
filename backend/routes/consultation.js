const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultationController');

// @route   POST /api/consultation/create
// @desc    Create a consultation session from a booking
// @access  Public (for demo)
router.post('/create', consultationController.createConsultation);

// @route   GET /api/consultation/user/:userId
// @desc    Get all consultations for a user
// @access  Public (for demo)
router.get('/user/:userId', consultationController.getUserConsultations);

// @route   GET /api/consultation/:id
// @desc    Get consultation details
// @access  Public (for demo)
router.get('/:id', consultationController.getConsultation);

// @route   GET /api/consultation/:id/join
// @desc    Join a consultation session
// @access  Public (for demo)
router.get('/:id/join', consultationController.joinConsultation);

// @route   POST /api/consultation/:id/end
// @desc    End a consultation
// @access  Public (for demo)
router.post('/:id/end', consultationController.endConsultation);

// @route   POST /api/consultation/:id/chat
// @desc    Send a chat message
// @access  Public (for demo)
router.post('/:id/chat', consultationController.sendMessage);

// @route   GET /api/consultation/:id/messages
// @desc    Get chat history
// @access  Public (for demo)
router.get('/:id/messages', consultationController.getMessages);

module.exports = router;
