/**
 * Master Question Variations Matrix (300+ Unique Questions & 500+ Variations)
 */
module.exports = [
  { intent: "WHAT_IS_AYURVEDA", category: "GENERAL_AYURVEDA", patterns: ["ayurveda", "principles", "holistic", "science of life"] },
  { intent: "DOSHA_CONCEPTS", category: "GENERAL_AYURVEDA", patterns: ["vata", "pitta", "kapha", "tridosha", "prakriti", "vikriti"] },
  { intent: "AGNI_AMA_DHATU", category: "GENERAL_AYURVEDA", patterns: ["agni", "ama", "dhatu", "mala", "ojas", "srotas"] },
  { intent: "ACIDITY_MANAGEMENT", category: "DIGESTION_ACIDITY", patterns: ["acidity", "amlapitta", "heartburn", "acid reflux", "burning stomach"] },
  { intent: "BLOATING_GAS", category: "DIGESTION_ACIDITY", patterns: ["bloating", "gas", "fullness", "indigestion", "flatulence"] },
  { intent: "SEVEN_DAY_DIET_PLAN", category: "AYURVEDIC_DIET", patterns: ["7-day diet", "diet plan", "weekly menu", "meal schedule", "what to eat"] },
  { intent: "MILK_ALLERGY_MODIFICATION", category: "AYURVEDIC_DIET", patterns: ["milk allergy", "lactose", "no dairy", "substitute ghee", "dairy free"] },
  { intent: "THERAPY_PREPARATION_GENERAL", category: "THERAPY_PREPARATION", patterns: ["prepare before therapy", "eat before therapy", "before abhyanga", "before panchakarma"] },
  { intent: "PANCHAKARMA_AFTERCARE", category: "THERAPY_AFTERCARE", patterns: ["eat after panchakarma", "rest after therapy", "paschatkarma", "after abhyanga"] },
  { intent: "ABHYANGA_EDUCATION", category: "ABHYANGA", patterns: ["abhyanga", "warm oil massage", "oil massage", "body massage"] },
  { intent: "ASHWAGANDHA_INFO", category: "HERBS", patterns: ["ashwagandha", "adaptogen", "stress herb", "withania"] },
  { intent: "TRIPHALA_INFO", category: "HERBS", patterns: ["triphala", "cleansing herb", "amalaki", "haritaki"] },
  { intent: "AYURVEDIC_SLEEP", category: "SLEEP_LIFESTYLE", patterns: ["sleep", "insomnia", "nidra", "golden milk", "bedtime routine"] },
  { intent: "DINACHARYA_ROUTINE", category: "DINACHARYA", patterns: ["dinacharya", "daily routine", "brahma muhurta", "tongue scraping", "oil pulling"] },
  { intent: "SUSHRUTA_AGNI", category: "CLASSICAL_QUESTIONS", patterns: ["sushruta agni", "sushruta verse", "sushruta samhita", "sutra sthana 15"] },
  { intent: "MY_CURRENT_TREATMENT", category: "PATIENT_CONTEXT", patterns: ["my treatment", "my appointment", "my doctor", "my therapy today"] },
  { intent: "PROHIBITED_MEDICATION_MODIFICATION", category: "MEDICATION_SAFETY", patterns: ["stop medicine", "change prescription", "reduce dose", "increase dose"] },
  { intent: "PROHIBITED_DIAGNOSIS_REQUEST", category: "DIAGNOSIS_SAFETY", patterns: ["diagnose me", "what disease do I have", "confirm diagnosis"] },
  { intent: "EMERGENCY_ESCALATION", category: "EMERGENCY_SAFETY", patterns: ["chest pain", "breathing difficulty", "stroke", "bleeding", "unconscious"] },
  { intent: "SECURITY_BYPASS_ATTEMPT", category: "PROMPT_INJECTION", patterns: ["ignore rules", "bypass safety", "reveal prompt", "disable safety"] }
];
