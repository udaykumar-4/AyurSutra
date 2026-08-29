const therapiesData = require('../../../data/ayurveda/therapies');
const clinicalDiseasesDataset = require('../../../data/ayurveda/clinicalDiseasesDataset');

class AyurvedaTherapyMatcher {
  /**
   * Match categories, symptoms text & patient context against curated clinical dataset & classical therapies
   */
  match(categoryTags, patientContext = {}, rawSymptomsText = '', quickSelections = []) {
    const matchedTherapies = [];
    const knownAllergies = (patientContext.knownAllergies || '').toLowerCase();
    const queryText = (rawSymptomsText + ' ' + quickSelections.join(' ') + ' ' + (patientContext.recordedCondition || '')).toLowerCase();

    // --- 1. Clinical Disease Dataset Matching ---
    clinicalDiseasesDataset.forEach(item => {
      const diseaseLower = item.disease.toLowerCase();
      const symptomsLower = item.symptoms.toLowerCase();
      const herbsLower = item.ayurvedicHerbs.toLowerCase();

      // Check keyword overlap
      const isDiseaseMatch = queryText.includes(diseaseLower) ||
        symptomsLower.split(', ').some(s => queryText.includes(s.toLowerCase())) ||
        herbsLower.split(', ').some(h => queryText.includes(h.toLowerCase()));

      if (isDiseaseMatch) {
        const precautions = [
          `Diet & Lifestyle: ${item.dietAndLifestyle}`,
          `Prevention: ${item.prevention}`,
          `Risk Factors: ${item.riskFactors}`
        ];

        if (knownAllergies && knownAllergies !== 'unconfirmed - not recorded') {
          precautions.push(`Verify formulation for patient allergy profile: ${patientContext.knownAllergies}`);
        } else {
          precautions.push('Patient allergy profile unconfirmed in record; clinician verification required.');
        }

        const contraindications = [
          `Possible Complications: ${item.complications}`,
          `Environmental Triggers: ${item.environmentalFactors}`
        ];

        matchedTherapies.push({
          therapyName: `${item.disease} — Ayurvedic Protocol (${item.ayurvedicHerbs})`,
          category: `Ayurvedic Clinical Protocol (${item.doshas} Dosha)`,
          objective: `${item.dietAndLifestyle} Recommended Formulation: ${item.formulation}`,
          traditionalRationale: `Herbs: ${item.ayurvedicHerbs}. Natural Remedies: ${item.herbalRemedies}. Target Dosha: ${item.doshas} (${item.prakriti} Prakriti). Guidance: ${item.patientRecommendations}.`,
          suggestedDuration: item.duration,
          suggestedSessions: `Yoga & Physical Therapy: ${item.yogaAndTherapy}`,
          precautions: precautions,
          contraindications: contraindications,
          classicalReferences: [
            {
              source: 'Curated Classical Ayurvedic Dataset',
              title: `${item.disease} (${item.hindiName} / ${item.marathiName})`,
              evidenceLevel: 'Classical Ayurvedic Textual Standard'
            }
          ],
          confidence: 'high',
          educationalOnly: true,
          requiresClinicianReview: true
        });
      }
    });

    // --- 2. Panchakarma Classical Therapy Matching ---
    const categoryToTherapyMap = {
      joint_stiffness: ['therapy_abhyanga', 'therapy_swedana', 'therapy_pizhichil', 'therapy_basti'],
      stress_sleep: ['therapy_shirodhara', 'therapy_abhyanga', 'therapy_nasya'],
      digestive_sluggishness: ['therapy_basti', 'therapy_virechana', 'therapy_abhyanga'],
      fatigue_energy: ['therapy_abhyanga', 'therapy_pizhichil', 'therapy_shirodhara'],
      skin_detox: ['therapy_virechana', 'therapy_vamana', 'therapy_abhyanga'],
      general_wellness: ['therapy_abhyanga', 'therapy_shirodhara', 'therapy_swedana']
    };

    const targetTherapyIds = new Set();
    categoryTags.forEach(cat => {
      const ids = categoryToTherapyMap[cat] || [];
      ids.forEach(id => targetTherapyIds.add(id));
    });

    targetTherapyIds.forEach(therapyId => {
      const therapyItem = therapiesData.find(t => t.id === therapyId);
      if (!therapyItem) return;

      const contraindications = [...(therapyItem.contraindications || [])];
      const precautions = [therapyItem.precautions || 'Must be performed under qualified Ayurvedic doctor supervision.'];

      if (knownAllergies && knownAllergies !== 'unconfirmed - not recorded') {
        precautions.push(`Verify oil formulation for known patient allergy profile: ${patientContext.knownAllergies}`);
      } else {
        precautions.push('Patient allergy profile unconfirmed in record; clinician verification required.');
      }

      if (therapyItem.avoidWhen && therapyItem.avoidWhen.length > 0) {
        precautions.push(`Avoid therapy during: ${therapyItem.avoidWhen.join(', ')}`);
      }

      const durationMap = {
        'therapy_abhyanga': { duration: '45-60 minutes per session', sessions: '5 to 7 sessions' },
        'therapy_shirodhara': { duration: '30-45 minutes per session', sessions: '7 to 14 sessions' },
        'therapy_swedana': { duration: '15-30 minutes post-Abhyanga', sessions: '5 to 7 sessions' },
        'therapy_basti': { duration: '30-45 minutes per session', sessions: '8 to 15 sessions' },
        'therapy_nasya': { duration: '20-30 minutes per session', sessions: '7 sessions' },
        'therapy_virechana': { duration: 'Full-day clinical protocol', sessions: '1 clinical cycle' },
        'therapy_vamana': { duration: 'Full-day clinical protocol', sessions: '1 clinical cycle' },
        'therapy_pizhichil': { duration: '60-90 minutes per session', sessions: '7 to 14 sessions' }
      };

      const timingInfo = durationMap[therapyItem.id] || { duration: '45-60 minutes per session', sessions: '5 to 7 sessions' };

      const classicalReferences = [];
      if (therapyItem.evidenceLevel) {
        classicalReferences.push({
          source: therapyItem.sourceType || 'Curated Internal Knowledge Base',
          title: therapyItem.title,
          evidenceLevel: therapyItem.evidenceLevel
        });
      }

      matchedTherapies.push({
        therapyName: therapyItem.title,
        category: therapyItem.category || 'Panchakarma Procedure',
        objective: therapyItem.description || therapyItem.benefits?.[0] || 'Ayurvedic wellness support',
        traditionalRationale: (therapyItem.benefits || []).join('; ') || 'Balances dosha and promotes longevity.',
        suggestedDuration: timingInfo.duration,
        suggestedSessions: timingInfo.sessions,
        precautions: precautions,
        contraindications: contraindications,
        classicalReferences: classicalReferences,
        confidence: 'high',
        educationalOnly: true,
        requiresClinicianReview: true
      });
    });

    // Deduplicate & return top 5 recommendations
    const uniqueMap = new Map();
    matchedTherapies.forEach(item => {
      if (!uniqueMap.has(item.therapyName)) {
        uniqueMap.set(item.therapyName, item);
      }
    });

    return Array.from(uniqueMap.values()).slice(0, 5);
  }
}

module.exports = new AyurvedaTherapyMatcher();
