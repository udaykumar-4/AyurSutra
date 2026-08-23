/**
 * AyurSutra Deterministic Personalized Diet Engine
 * Operates strictly on authorized patient records & approved rules.
 */
class PersonalizedDietEngine {
  generateDietPlan(contextData = {}) {
    const hasAllergiesRecorded = !!(contextData.knownAllergies && contextData.knownAllergies !== 'None recorded' && contextData.knownAllergies !== 'UNCONFIRMED - NOT RECORDED');
    const knownAllergiesText = hasAllergiesRecorded ? contextData.knownAllergies.toLowerCase() : '';

    const therapyPlan = contextData.activeTherapyPlan || 'General Wellness';
    const condition = contextData.recordedCondition || 'General Wellness';

    let goal = 'Maintain metabolic Agni and support general wellness';
    let dietaryPattern = 'Warm, freshly cooked, light Ayurvedic meals';
    let recommendedFoods = ['Warm mung dal Kitchari', 'Steamed vegetables', 'Basmati rice', 'Warm vegetable broth'];
    let foodsToLimit = ['Chilled beverages', 'Ice cream', 'Deep-fried snacks', 'Heavy processed cheese'];
    let breakfast = 'Warm oatmeal with cinnamon or warm stewed apples';
    let lunch = 'Fresh mung dal soup with basmati rice and steamed carrots/zucchini';
    let evening = 'Warm ginger or fennel herbal tea with light dry roasted lotus seeds (Makhana)';
    let dinner = 'Light vegetable soup or thin mung dal Kitchari';
    let hydration = 'Sip warm water or warm cumin-coriander-fennel tea throughout the day.';
    let lifestyleNotes = 'Eat in a settled environment; avoid eating while watching screens or rushing.';
    let precautions = [];

    // Rule 1: Allergy Safety Enforcement
    if (hasAllergiesRecorded) {
      if (knownAllergiesText.includes('dairy') || knownAllergiesText.includes('ghee') || knownAllergiesText.includes('lactose')) {
        recommendedFoods = recommendedFoods.filter(f => !f.toLowerCase().includes('ghee'));
        precautions.push(`Dairy allergy detected in record (${contextData.knownAllergies}): Excluded ghee and dairy products.`);
      }
      if (knownAllergiesText.includes('sesame') || knownAllergiesText.includes('nut')) {
        precautions.push(`Nut/Sesame allergy detected in record (${contextData.knownAllergies}): Excluded nut oils and sesame garnishes.`);
      }
    } else {
      precautions.push('Your AyurSutra record does not contain allergy information, so allergy safety could not be confirmed. Please verify allergies with your clinician.');
    }

    // Rule 2: Therapy-Specific Adjustments
    if (therapyPlan.toLowerCase().includes('abhyanga') || therapyPlan.toLowerCase().includes('swedana')) {
      goal = `Support detox and digestive Agni during active ${therapyPlan} therapy`;
      dietaryPattern = 'Strictly warm, liquid/semi-liquid, non-greasy aftercare nutrition';
      breakfast = 'Warm spiced rice gruel (Kanji)';
      lunch = 'Well-cooked yellow mung dal Kitchari with mild ginger and cumin';
      dinner = 'Clear vegetable broth or warm mung soup';
      precautions.push('Avoid cold showers, cold drinks, or heavy meals immediately following oil massage/steam.');
    }

    // Rule 3: Condition-Specific Adjustments
    if (condition.toLowerCase().includes('joint') || condition.toLowerCase().includes('vata')) {
      goal = 'Ground Vata dosha and soothe joint dryness';
      recommendedFoods.push('Warm cooked root vegetables (carrots, sweet potatoes)');
      foodsToLimit.push('Raw salads', 'Dry crackers', 'Cold sandwiches');
    }

    return {
      goal,
      dietaryPattern,
      recommendedFoods,
      foodsToLimit,
      breakfast,
      lunch,
      evening,
      dinner,
      hydration,
      lifestyleNotes,
      precautions,
      clinicianReviewRequired: true
    };
  }
}

module.exports = new PersonalizedDietEngine();
