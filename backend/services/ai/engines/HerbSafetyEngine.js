/**
 * AyurSutra Controlled Herb Safety Engine
 * Enforces safety boundaries, allergy checks, and non-prescribing rules.
 */
class HerbSafetyEngine {
  evaluateHerbSafety(herbEntry, patientContext = {}) {
    const precautions = [...(herbEntry.precautions ? [herbEntry.precautions] : [])];
    const warnings = [];

    // 1. Mandatory Dosage Notice
    const dosageInfo = herbEntry.dosageInfo || 'Dosage is not provided by the AyurSutra knowledge base. Please consult the treating clinician.';

    // 2. Allergy Check
    if (patientContext.knownAllergies && patientContext.knownAllergies !== 'None recorded' && patientContext.knownAllergies !== 'UNCONFIRMED - NOT RECORDED') {
      const allergyText = patientContext.knownAllergies.toLowerCase();
      if (herbEntry.allergyWarnings && herbEntry.allergyWarnings.some(w => allergyText.includes(w.toLowerCase()))) {
        warnings.push(`⚠️ ALLERGY WARNING: Potential sensitivity match between recorded allergy (${patientContext.knownAllergies}) and ${herbEntry.title}.`);
      }
    } else {
      warnings.push('Allergy history is unconfirmed in database; clinician verification required before herb use.');
    }

    // 3. Pregnancy & Interaction Warnings
    if (herbEntry.pregnancyCaution) {
      warnings.push(`Pregnancy Caution: ${herbEntry.pregnancyCaution}`);
    }

    if (herbEntry.interactionsWarning) {
      warnings.push(`Medication Interactions: ${herbEntry.interactionsWarning}`);
    }

    return {
      herbTitle: herbEntry.title,
      educationalSummary: herbEntry.educationalSummary,
      benefits: herbEntry.benefits,
      precautions,
      warnings,
      dosageInfo,
      requiresClinicianApproval: true
    };
  }
}

module.exports = new HerbSafetyEngine();
