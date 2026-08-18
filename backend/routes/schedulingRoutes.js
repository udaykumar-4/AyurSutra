const express = require('express');
const router = express.Router();
const { checkConflicts, getRecommendations } = require('../controllers/schedulingController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/scheduling/check-conflicts
router.post('/check-conflicts', protect, checkConflicts);

// POST /api/scheduling/recommendations
router.post('/recommendations', protect, getRecommendations);

module.exports = router;
