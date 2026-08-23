module = module || {};
module.exports = [
  {
    id: 'herb_ashwagandha',
    topic: 'adaptogen_wellness',
    category: 'herbs',
    intents: ['HERB_INFORMATION', 'HERB_SAFETY', 'STRESS', 'SLEEP'],
    keywords: ['ashwagandha', 'stress', 'sleep', 'vitality', 'adaptogen'],
    commonName: 'Ashwagandha / Indian Ginseng',
    sanskritName: 'Ashwagandha',
    educationalSummary: 'A traditional Ayurvedic adaptogenic root known for nervous system support and vitality.',
    benefits: ['Supports stress resilience', 'Promotes restful sleep', 'Helps calm nervous exhaustion'],
    precautions: 'Do not combine with sedative medications without medical review.',
    contraindications: ['Pregnancy (without explicit physician supervision)', 'Hyperthyroidism without monitoring'],
    allergyWarnings: ['Nightshade family sensitivity (Solanaceae)'],
    interactionsWarning: 'May potentiate sedative and thyroid medication effects',
    pregnancyCaution: 'Requires physician consultation prior to use during pregnancy.',
    dosageInfo: 'Dosage is not provided by the AyurSutra knowledge base. Please consult the treating clinician.',
    personalizationRules: {
      checkAllergies: true
    },
    evidenceLevel: 'Classical Ayurvedic Textual Standard',
    allowedForPatient: true,
    allowedForDoctor: true,
    allowedForTherapist: true,
    allowedForReceptionist: true,
    clinicianReviewRequired: true
  },
  {
    id: 'herb_triphala',
    topic: 'digestive_wellness',
    category: 'herbs',
    intents: ['HERB_INFORMATION', 'HERB_SAFETY', 'DIET_GENERAL'],
    keywords: ['triphala', 'digestion', 'constipation', 'colon', 'detox'],
    commonName: 'Triphala (Amalaki, Bibhitaki, Haritaki)',
    sanskritName: 'Triphala',
    educationalSummary: 'A traditional formulation of three Ayurvedic fruits used for digestive regularity and colon cleansing.',
    benefits: ['Supports gentle bowel regularity', 'Rich in natural antioxidants', 'Promotes digestive Agni'],
    precautions: 'Do not use as a long-term replacement for adequate dietary fiber and hydration.',
    contraindications: ['Severe ulcerative conditions', 'Pregnancy (without physician approval)', 'Acute diarrhea'],
    allergyWarnings: ['Fruit/tannin sensitivity'],
    interactionsWarning: 'May increase intestinal transit time',
    pregnancyCaution: 'Not recommended during pregnancy without direct doctor instruction.',
    dosageInfo: 'Dosage is not provided by the AyurSutra knowledge base. Please consult the treating clinician.',
    personalizationRules: {
      checkAllergies: true
    },
    evidenceLevel: 'Classical Ayurvedic Textual Standard',
    allowedForPatient: true,
    allowedForDoctor: true,
    allowedForTherapist: true,
    allowedForReceptionist: true,
    clinicianReviewRequired: true
  }
];
