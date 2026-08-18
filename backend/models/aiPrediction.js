const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const conditionSchema = new Schema({
  conditionName: { type: String, required: true },
  probabilityCategory: { type: String, default: 'Moderate' },
  supportingFactors: [{ type: String }],
  differentialConsiderations: { type: String }
}, { _id: false });

const aiPredictionSchema = new Schema({
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
  presentingSymptoms: {
    type: String,
    required: true
  },
  possibleConditions: [conditionSchema],
  uncertainty: { type: String, default: 'Low-to-moderate clinical uncertainty' },
  limitations: { type: String, default: 'Requires clinical examination and laboratory validation' },
  clinicianReviewRequired: { type: Boolean, default: true },
  disclaimer: {
    type: String,
    default: '⚠️ AI-generated clinical decision support. This is not a confirmed diagnosis and requires clinician verification.'
  }
}, { timestamps: true });

module.exports = mongoose.model('AIPrediction', aiPredictionSchema);
