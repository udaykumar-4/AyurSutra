const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const prescriptionSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  therapistId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  treatment: {
    type: String,
    required: true
  },
  duration: { // in days
    type: Number,
    required: true
  },
  plan: { // Detailed plan
    type: String
  },
  notes: { // Doctor's notes
    type: String
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  progressCompleted: { // Number of sessions done
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);