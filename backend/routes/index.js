const express = require('express');
const router = express.Router();

// Import all the individual route files
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const prescriptionRoutes = require('./prescriptionRoutes');
const noteRoutes = require('./noteRoutes');
const reportRoutes = require('./reportRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const schedulingRoutes = require('./schedulingRoutes');
const aiRoutes = require('./aiRoutes');

// Tell the router to use these files for specific paths
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/notes', noteRoutes);
router.use('/reports', reportRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/scheduling', schedulingRoutes);
router.use('/ai', aiRoutes);

module.exports = router;