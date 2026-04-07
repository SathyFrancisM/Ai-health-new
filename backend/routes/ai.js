const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// @route   POST api/ai/consultation
// @desc    Get AI consultation with home remedies
// @access  Private (or Public for now for demo)
router.post('/consultation', aiController.getConsultation);

module.exports = router;
