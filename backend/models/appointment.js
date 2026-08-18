const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User' // Links to the User model
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  therapistId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  treatment: {
    type: String,
    required: true
  },
  appointment_date: {
    type: Date,
    required: true
  },
  appointment_time: {
    type: String, // e.g., "10:00"
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'in-progress', 'confirmed'],
    default: 'scheduled'
  },
  specialRequirements: {
    type: String
  },
  cost: { type: Number },
  isPaid: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);