const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const aiAuditLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true // e.g. 'GET_OUTCOME_ANALYTICS', 'GET_PATIENT_ANALYTICS'
  },
  targetPatientId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('AIAuditLog', aiAuditLogSchema);
