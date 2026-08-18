const smartSchedulingService = require('../services/scheduling/smartSchedulingService');

// @desc    Check for appointment scheduling conflicts
// @route   POST /api/scheduling/check-conflicts
const checkConflicts = async (req, res) => {
  try {
    const { staffId, date, time, durationMins } = req.body;

    if (!staffId || !date || !time) {
      return res.status(400).json({ message: 'staffId, date, and time are required fields' });
    }

    const result = await smartSchedulingService.checkConflict(staffId, date, time, durationMins || 60);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get ranked available slot recommendations
// @route   POST /api/scheduling/recommendations
const getRecommendations = async (req, res) => {
  try {
    const { staffId, preferredDate, preferredTime, durationMins } = req.body;

    if (!staffId || !preferredDate) {
      return res.status(400).json({ message: 'staffId and preferredDate are required fields' });
    }

    const result = await smartSchedulingService.getRecommendations(
      staffId,
      preferredDate,
      preferredTime || '10:00 AM',
      durationMins || 60
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  checkConflicts,
  getRecommendations
};
