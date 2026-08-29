const User = require('../../../models/user');
const Prescription = require('../../../models/prescription');

class PatientContextReader {
  /**
   * Reads minimal authorized context for patient
   */
  async readContext(patientId) {
    const patientUser = await User.findById(patientId).select('age gender condition allergies full_name');
    if (!patientUser) return null;

    const activeRx = await Prescription.findOne({ patientId, status: 'in-progress' });

    return {
      patientId: patientUser._id,
      patientName: patientUser.full_name,
      patientAge: patientUser.age || 'Unrecorded',
      gender: patientUser.gender || 'Unrecorded',
      recordedCondition: patientUser.condition || 'Unrecorded',
      hasRecordedAllergies: !!patientUser.allergies,
      knownAllergies: patientUser.allergies || 'UNCONFIRMED - NOT RECORDED',
      activeTherapy: activeRx ? activeRx.treatment : 'None'
    };
  }
}

module.exports = new PatientContextReader();
