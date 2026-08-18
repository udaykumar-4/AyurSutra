const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  // --- Doctor Feedback ---
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorRating: {
    type: Number,
    min: 1,
    max: 5
  },
  doctorFeedback: {
    type: String,
    trim: true
  },
  // --- Therapist Feedback ---
  therapistId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  therapistRating: {
    type: Number,
    min: 1,
    max: 5
  },
  therapistFeedback: {
    type: String,
    trim: true
  },
  // --- Overall Feedback ---
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  overallFeedback: {
    type: String,
    trim: true
  },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);