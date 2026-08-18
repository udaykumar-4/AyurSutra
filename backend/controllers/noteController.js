const Note = require('../models/note');

// @desc    Get all notes for a specific patient
// @route   GET /api/notes/patient/:patientId
const getNotesForPatient = async (req, res) => {
  try {
    const notes = await Note.find({ patientId: req.params.patientId })
      .populate('authorId', 'full_name role') // Get the author's name and role
      .sort({ createdAt: -1 }); // Newest notes first
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
const createNote = async (req, res) => {
  try {
    const { patientId, note } = req.body;
    const authorId = req.user._id; // We get this from the 'protect' middleware

    const newNote = new Note({
      patientId,
      authorId,
      note,
    });

    const savedNote = await newNote.save();
    // Populate author info before sending it back
    const populatedNote = await savedNote.populate('authorId', 'full_name role');
    res.status(201).json(populatedNote);
  } catch (error)
 {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { getNotesForPatient, createNote };