const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const optionSchema = new Schema({
  treatmentName: { type: String, required: true },
  suggestedSessions: { type: Number, default: 7 },
  primaryObjective: { type: String },
  rationale: { type: String },
  considerations: { type: String }
}, { _id: false });

const aiRecommendationSchema = new Schema({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  presentingCondition: {
    type: String,
    required: true
  },
  suggestedOptions: [optionSchema],
  contraindicationWarnings: [{ type: String }],
  uncertainty: { type: String, default: 'Low-to-moderate clinical uncertainty' },
  clinicianReviewRequired: { type: Boolean, default: true },
  disclaimer: {
    type: String,
    default: '⚠️ AI-generated clinical decision support. Requires clinician verification.'
  }
}, { timestamps: true });

module.exports = mongoose.model('AIRecommendation', aiRecommendationSchema);
