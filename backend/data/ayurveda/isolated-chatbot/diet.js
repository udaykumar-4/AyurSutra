/**
 * Category 3: Ayurvedic Diet & Meal Plans Dataset
 */
module.exports = [
  {
    id: "AYU-DIET-001",
    category: "AYURVEDIC_DIET",
    intent: "SEVEN_DAY_DIET_PLAN",
    question: "Can you give me a 7-day Ayurvedic diet plan?",
    variations: [
      "Can you give me a 7-day Ayurvedic diet plan?",
      "Give me a diet plan.",
      "Give me an Ayurvedic diet plan.",
      "Give me a 1-day diet plan.",
      "Make a diet plan for me.",
      "What should I eat for breakfast lunch and dinner?",
      "General Ayurvedic weekly meal guide",
      "Ayurvedic 7 day eating regimen",
      "What is a standard Pathya diet plan?"
    ],
    expectedAnswerType: "PERSONALIZED_DIET",
    answer: "Here is a standard 7-day educational Ayurvedic meal pattern based on easily digestible Pathya foods:\n\n• **Breakfast (07:30 - 08:30 AM):** Warm cooked oatmeal or stewed apples cooked with cinnamon & cardamom.\n• **Lunch (12:00 - 01:30 PM - Primary Meal):** Warm yellow mung dal Kitchari cooked with cumin, ginger, and turmeric, accompanied by steamed zucchini or carrots.\n• **Dinner (06:30 - 07:30 PM - Light Meal):** Light mung soup or warm vegetable broth with cooked basmati rice.\n• **Hydration:** Sip warm water or cumin tea throughout the day.\n\n*Note: Known allergies (such as dairy or nuts) must always be respected. Verify allergy records before making dietary modifications.*",
    safetyLevel: "NORMAL",
    requiresPatientContext: true,
    requiresAllergyCheck: true,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [
      {
        id: "AH-SUTRA-8-35",
        sourceId: "ashtanga-hridaya",
        sourceName: "Ashtanga Hridaya",
        sourceUrl: "https://vedotpatti.in/samhita/Vag/ehrudayam/?mod=read",
        samhita: "Ashtanga Hridaya",
        sthana: "Sutra Sthana",
        chapter: "8",
        chapterName: "Matrasitiya Adhyaya",
        verse: "35",
        originalText: "kale satmya suci hita matravad aviruddham...",
        transliteration: "kale satmya suci hita matravad aviruddham",
        translation: "Eat clean, wholesome, compatible foods in proper measure at the right time.",
        explanation: "Timely, compatible eating maintains digestive harmony.",
        topics: ["diet", "pathya", "meal_timing"],
        safetyClassification: "EDUCATIONAL_REFERENCE",
        verified: true
      }
    ],
    sources: ["Ashtanga Hridaya Sutra Sthana Ch 8"],
    disclaimer: "⚠️ Educational meal framework. If allergy information is unconfirmed in your patient profile, verify all ingredients prior to consumption."
  },
  {
    id: "AYU-DIET-002",
    category: "AYURVEDIC_DIET",
    intent: "MILK_ALLERGY_MODIFICATION",
    question: "I am allergic to milk. Modify the diet for me.",
    variations: [
      "I am allergic to milk. Modify the diet for me.",
      "I cannot eat dairy. What should I substitute?",
      "Lactose intolerant Ayurvedic diet",
      "Milk allergy dietary modifications",
      "Replace ghee and milk in diet plan",
      "Can I follow Ayurvedic diet without dairy?",
      "No dairy Ayurvedic meal plan"
    ],
    expectedAnswerType: "PERSONALIZED_DIET",
    answer: "🌿 **Allergy Excluded Diet Modification (Dairy-Free):**\n\nAll dairy products (cow milk, ghee, curd, paneer, butter) are **STRICTLY EXCLUDED**.\n\n• **Substitutes:** Use warm unsweetened almond milk or coconut milk infused with cardamom.\n• **Cooking Medium:** Use cold-pressed sesame oil or coconut oil instead of Ghee.\n• **Meal Plan:** Warm Kitchari cooked with olive/sesame oil and spices, steamed green vegetables, and baked apples.\n\n*Safety Guarantee: Allergy safety takes absolute priority over traditional dairy suggestions.*",
    safetyLevel: "NORMAL",
    requiresPatientContext: true,
    requiresAllergyCheck: true,
    diagnosisAllowed: false,
    prescriptionAllowed: false,
    medicationModificationAllowed: false,
    emergency: false,
    classicalReferences: [],
    sources: ["AyurSutra Allergy Exclusions Engine"],
    disclaimer: "⚠️ Personalized allergy exclusion enforced."
  }
];
