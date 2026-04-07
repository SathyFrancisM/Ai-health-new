const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');

// @route   POST api/emergency/trigger
// @desc    Trigger manual or automatic emergency alert
// @access  Public (for demo simplicity)
router.post('/trigger', emergencyController.triggerAlert);

module.exports = router;
