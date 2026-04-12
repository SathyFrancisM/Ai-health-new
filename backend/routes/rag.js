const express = require('express');
const router = express.Router();
const ragController = require('../controllers/ragController');

// @route   POST /api/rag/query
// @desc    Enhanced RAG query with vector search + safety layer
// @access  Public
router.post('/query', ragController.query);

// @route   GET /api/rag/remedies
// @desc    Browse remedies database (paginated)
// @access  Public
router.get('/remedies', ragController.getRemedies);

// @route   GET /api/rag/remedies/:disease
// @desc    Get specific disease remedies
// @access  Public
router.get('/remedies/:disease', ragController.getRemedyByDisease);

module.exports = router;
