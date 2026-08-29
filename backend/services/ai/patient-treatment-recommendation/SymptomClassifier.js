class SymptomClassifier {
  /**
   * Parse symptoms and quick selections into category tags
   */
  classify(symptomsText = '', quickSelections = []) {
    const categories = new Set();
    const text = (symptomsText + ' ' + quickSelections.join(' ')).toLowerCase();

    // 1. Joint Stiffness & Pain
    if (text.includes('joint') || text.includes('stiff') || text.includes('pain') || text.includes('back') || text.includes('knee') || text.includes('arthritis') || text.includes('muscle') || text.includes('sciatica')) {
      categories.add('joint_stiffness');
    }

    // 2. Stress & Sleep / Relaxation
    if (text.includes('stress') || text.includes('sleep') || text.includes('insomnia') || text.includes('anxiety') || text.includes('relax') || text.includes('headache') || text.includes('mind') || text.includes('tension')) {
      categories.add('stress_sleep');
    }

    // 3. Digestive Sluggishness
    if (text.includes('digest') || text.includes('constipation') || text.includes('gas') || text.includes('bloat') || text.includes('acidity') || text.includes('stomach') || text.includes('gut') || text.includes('sluggish')) {
      categories.add('digestive_sluggishness');
    }

    // 4. Fatigue & Low Energy
    if (text.includes('fatigue') || text.includes('tired') || text.includes('energy') || text.includes('exhaust') || text.includes('weakness') || text.includes('lethargy')) {
      categories.add('fatigue_energy');
    }

    // 5. Skin & Detox
    if (text.includes('skin') || text.includes('rash') || text.includes('detox') || text.includes('acne') || text.includes('allergy') || text.includes('pitta') || text.includes('itching')) {
      categories.add('skin_detox');
    }

    // Default to general_wellness if no specific category matched
    if (categories.size === 0) {
      categories.add('general_wellness');
    }

    return Array.from(categories);
  }
}

module.exports = new SymptomClassifier();
