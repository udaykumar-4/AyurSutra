module = module || {};
module.exports = [
  {
    id: 'diet_abhyanga_aftercare',
    topic: 'post_therapy_nutrition',
    category: 'diet',
    intents: ['DIET_PERSONALIZED', 'THERAPY_AFTERCARE', 'DIET_GENERAL'],
    keywords: ['abhyanga', 'post', 'aftercare', 'kitchari', 'warm', 'soup', 'diet'],
    indications: ['Post-Abhyanga massage', 'Post-Swedana steam', 'Post-therapy recovery'],
    educationalSummary: 'Warm, light, easily digestible meals such as Kitchari, mung dal soup, or warm vegetable broth.',
    benefits: ['Kindles Agni (digestive fire)', 'Prevents Ama (toxin) formation after oil massage'],
    precautions: 'Sip warm water or ginger tea throughout the day.',
    contraindications: ['Ice water', 'Chilled beverages', 'Heavy fried foods', 'Raw salads immediately after therapy'],
    allergyWarnings: ['Verify dairy/ghee allergy before adding ghee to Kitchari'],
    interactionsWarning: 'None recorded for standard food preparations',
    preparation: 'Cook split yellow mung dal and basmati rice with mild spices like cumin, ginger, and turmeric.',
    aftercare: 'Rest for 30 minutes after meal; avoid cold winds.',
    personalizationRules: {
      requireActiveTherapy: true,
      checkAllergies: true
    },
    evidenceLevel: 'Classical Ayurvedic Textual Standard',
    allowedForPatient: true,
    allowedForDoctor: true,
    allowedForTherapist: true,
    allowedForReceptionist: true,
    clinicianReviewRequired: false
  },
  {
    id: 'diet_vata_pacifying',
    topic: 'dosha_balancing_diet',
    category: 'diet',
    intents: ['DIET_GENERAL', 'DOSHA_EDUCATION'],
    keywords: ['vata', 'joint', 'dryness', 'grounding', 'warm', 'ghee'],
    indications: ['Vata imbalance', 'Joint stiffness', 'Dry skin', 'Insomnia'],
    educationalSummary: 'Warm, moist, grounding foods with naturally sweet, sour, and salty tastes cooked with healthy fats like ghee.',
    benefits: ['Relieves joint dryness', 'Calms nervous system', 'Promotes regular digestion'],
    precautions: 'Use healthy fats like Ghee and sesame oil in moderation.',
    contraindications: ['Dry crackers', 'Cold salads', 'Raw bitter greens', 'Iced drinks'],
    allergyWarnings: ['Check for sesame or dairy sensitivity'],
    interactionsWarning: 'None recorded',
    preparation: 'Serve cooked grains and root vegetables warm with mild digestive spices.',
    aftercare: 'Eat in a calm, settled environment.',
    personalizationRules: {
      requireActiveTherapy: false,
      checkAllergies: true
    },
    evidenceLevel: 'Classical Ayurvedic Textual Standard',
    allowedForPatient: true,
    allowedForDoctor: true,
    allowedForTherapist: true,
    allowedForReceptionist: true,
    clinicianReviewRequired: false
  }
];
