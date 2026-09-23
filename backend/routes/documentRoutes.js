const express = require('express');
const router = express.Router();
const Document = require('../models/document');
const { protect } = require('../middleware/authMiddleware');

// GET /api/documents - Get documents for logged in patient or specific patient
router.get('/', protect, async (req, res) => {
  try {
    const patientId = req.query.patientId || req.user._id;
    const documents = await Document.find({ patientId }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/documents - Upload a new medical document
router.post('/', protect, async (req, res) => {
  const { name, type, fileData, patientId } = req.body;
  try {
    const targetPatientId = req.user.role === 'patient' ? req.user._id : (patientId || req.user._id);
    const document = await Document.create({
      patientId: targetPatientId,
      name,
      type,
      fileData
    });
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', protect, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    await document.deleteOne();
    res.json({ message: 'Document removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
