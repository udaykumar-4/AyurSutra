/**
 * Category 7: Herbs & Traditional Safety Dataset
 */
module.exports = [
  {
    id: "AYU-HERB-001",
    category: "HERBS",
    intent: "ASHWAGANDHA_INFO",
    question: "What is Ashwagandha traditionally used for?",
    variations: [
      "What is Ashwagandha traditionally used for?",
      "What is Ashwagandha?",
      "What are the benefits of Ashwagandha?",
      "Is Ashwagandha safe for me?",
      "What are the Ayurvedic properties of Ashwagandha?",
      "What is the Rasa and Virya of Ashwagandha?",
      "Can I take Ashwagandha with my medicine?",
      "Can I take Ashwagandha during my treatment?",
      "Who should avoid Ashwagandha?",
      "What is the dosage for Ashwagandha?"
    ],
    expectedAnswerType: "HERB_INFORMATION",
    answer: "🌿 **Ashwagandha (Withania Somnifera):**\n• **Sanskrit Name:** Ashwagandha (Smell of a horse / confers strength of a horse)\n• **Traditional Properties:** Rasa (Tikta/Katu/Madhura), Virya (Ushna - Heating), Vipaka (Madhura), Karma (Balya - Tonic, Rasayana - Rejuvenative, Vata-Kapha Hara).\n• **Traditional Uses:** Enhances stress resilience, supports nervous exhaustion, promotes restful sleep, and rebuilds vitality.\n• **Precautions:** Avoid in acute high Pitta conditions or severe hyperthyroidism without supervision. Avoid during pregnancy.\n• **Dosage Notice:** *Specific dosage is not provided autonomously by AyurSutra. Discuss exact dosing and potential drug interactions with your qualified treating clinician.*",
    safetyLevel: "NORMAL",
    requiresPatientContext: false,
    requiresAllergyCheck: true,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [],
    sources: ["AyurSutra Herb Safety Rules"],
    disclaimer: "⚠️ Educational herb information. Clinician approval required before therapeutic use."
  },
  {
    id: "AYU-HERB-002",
    category: "HERBS",
    intent: "TRIPHALA_INFO",
    question: "What is Triphala and what are its benefits?",
    variations: [
      "What is Triphala and what are its benefits?",
      "What is Triphala?",
      "What fruits make up Triphala?",
      "Is Triphala good for digestion?",
      "Can I take Triphala every day?",
      "Precautions for Triphala"
    ],
    expectedAnswerType: "HERB_INFORMATION",
    answer: "🌿 **Triphala (Amalaki, Bibhitaki, Haritaki):**\n• **Composition:** Equal parts of three traditional fruits.\n• **Traditional Uses:** Supports gentle bowel regularity, kindles metabolic Agni, cleanses the colon, and provides natural antioxidant protection.\n• **Precautions:** Avoid during active diarrhea or severe acute dysentery. Pregnant women should consult their physician prior to use.",
    safetyLevel: "NORMAL",
    requiresPatientContext: false,
    requiresAllergyCheck: false,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [],
    sources: ["AyurSutra Curated Herb Database"],
    disclaimer: "⚠️ Educational herb information."
  }
];
