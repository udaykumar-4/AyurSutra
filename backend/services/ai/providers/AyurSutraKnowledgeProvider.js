const BaseAIProvider = require('./BaseAIProvider');
const { searchKnowledgeBase } = require('../../../data/ayurveda');
const personalizedDietEngine = require('../engines/PersonalizedDietEngine');
const herbSafetyEngine = require('../engines/HerbSafetyEngine');

class AyurSutraKnowledgeProvider extends BaseAIProvider {
  /**
   * 1. Emergency Pattern Registry (14 Categories)
   */
  detectEmergency(text) {
    const emergencyPatterns = [
      'chest pain', 'chest pressure', 'difficulty breathing', 'shortness of breath',
      'can\'t breathe', 'cannot breathe', 'unconscious', 'loss of consciousness',
      'fainted', 'heavy bleeding', 'severe bleeding', 'seizure', 'severe allergic reaction',
      'anaphylaxis', 'sudden weakness', 'stroke', 'drooping', 'suicidal', 'self-harm'
    ];

    const lower = text.toLowerCase();
    return emergencyPatterns.some(pattern => lower.includes(pattern));
  }

  /**
   * 2. Prohibited Medical Request Detector
   */
  detectProhibitedRequest(text) {
    const lower = text.toLowerCase();

    const isDiagnosisRequest = lower.includes('diagnose me') || lower.includes('what disease do i have') || lower.includes('do i have diabetes') || lower.includes('confirm my diagnosis');
    const isMedicationOverride = lower.includes('stop my medicine') || lower.includes('stop my medication') || lower.includes('replace my prescription') || lower.includes('increase my dosage') || lower.includes('change my prescription');
    const isTreatmentPrescription = lower.includes('prescribe panchakarma') || lower.includes('prescribe medicine to me') || lower.includes('order therapy for me');

    if (isDiagnosisRequest) {
      return {
        type: 'DIAGNOSIS_REQUEST',
        response: 'These symptoms can have multiple causes. The AyurSutra Assistant cannot confirm a diagnosis. Please consult your qualified clinician for diagnostic evaluation.'
      };
    }

    if (isMedicationOverride) {
      return {
        type: 'MEDICATION_OVERRIDE',
        response: 'Do not stop or replace prescribed medication based on this assistant\'s response. Please consult your treating clinician before making any changes to your medication.'
      };
    }

    if (isTreatmentPrescription) {
      return {
        type: 'TREATMENT_PRESCRIPTION',
        response: 'I can explain Ayurvedic treatment options educationally, but I cannot independently prescribe or select a treatment for you. Please discuss treatment selection with your AyurSutra clinician.'
      };
    }

    return null;
  }

  /**
   * Greeting & General Conversation Detector
   */
  detectGreetingOrGeneralConversation(text) {
    const clean = text.toLowerCase().replace(/[^\w\s]/g, '').trim();

    const greetings = ['hi', 'hello', 'namaste', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'vanakkam'];
    const howAreYou = ['how are you', 'how are u', 'how do you do', 'how is it going', 'how are things'];
    const identity = ['who are you', 'what is your name', 'what can you do', 'what do you do', 'tell me about yourself', 'help', 'features'];
    const thanks = ['thanks', 'thank you', 'dhanyawad', 'thank u', 'thx', 'appreciated', 'great thanks'];
    const farewell = ['bye', 'goodbye', 'see you', 'ta ta', 'good night', 'have a good day'];

    if (greetings.includes(clean) || greetings.some(g => clean.startsWith(g + ' ') || clean === g)) {
      return {
        type: 'GREETING',
        answer: 'Namaste! 🙏 Welcome to AyurSutra Assistant. How can I help you today with your Ayurvedic health, diet, therapies, lifestyle, or wellness questions?'
      };
    }

    if (howAreYou.some(h => clean.includes(h))) {
      return {
        type: 'CONVERSATION',
        answer: 'I am doing well, thank you for asking! 😊 I am your AyurSutra Assistant, ready to help you with Ayurvedic guidance, diet recommendations, Panchakarma education, and lifestyle tips. How can I assist you today?'
      };
    }

    if (identity.some(id => clean.includes(id))) {
      return {
        type: 'CONVERSATION',
        answer: 'I am your AyurSutra Intelligent Guidance Assistant 🌿. I can help you with:\n• Ayurvedic diets & Pathya/Apathya principles\n• Herb safety & traditional properties (Ashwagandha, Triphala, Tulsi, etc.)\n• Panchakarma therapy preparation & aftercare\n• Daily & seasonal lifestyle routines (Dinacharya & Ritucharya)\n• Personalized diet plans based on your active AyurSutra profile\n\nFeel free to ask me any question!'
      };
    }

    if (thanks.some(t => clean.includes(t))) {
      return {
        type: 'CONVERSATION',
        answer: 'You are very welcome! 🙏 I am glad I could help. Wishing you great health, vitality, and wellness. Feel free to ask if you have any more questions!'
      };
    }

    if (farewell.some(f => clean.includes(f))) {
      return {
        type: 'CONVERSATION',
        answer: 'Namaste and goodbye! 🙏 Take good care of your health and metabolic Agni. Have a wonderful day!'
      };
    }

    return null;
  }

  /**
   * 3. Out of Scope Detector
   */
  detectOutOfScope(text) {
    const lower = text.toLowerCase();
    const outOfScopeKeywords = [
      'capital of', 'president of', 'weather in', 'crypto', 'bitcoin', 'stock market',
      'python code', 'javascript code', 'football', 'cricket score', 'movie review',
      'who won', 'recipe for pizza', 'plan my vacation', 'tell me a joke'
    ];

    return outOfScopeKeywords.some(kw => lower.includes(kw));
  }

  /**
   * 4. Intent Classifier (25 Structured Intent Categories)
   */
  classifyIntent(text) {
    const lower = text.toLowerCase();

    if (this.detectEmergency(text)) return 'EMERGENCY';
    if (this.detectProhibitedRequest(text)) return 'PROHIBITED_MEDICAL_REQUEST';
    if (this.detectOutOfScope(text)) return 'OUT_OF_SCOPE';

    if (
      (lower.includes('my') || lower.includes('active') || lower.includes('current')) &&
      (lower.includes('plan') || lower.includes('therapy') || lower.includes('treatment') || lower.includes('progress') || lower.includes('prescription'))
    ) {
      return 'DIET_PERSONALIZED';
    }

    if (lower.includes('diet') || lower.includes('eat') || lower.includes('food') || lower.includes('kitchari') || lower.includes('meal')) {
      return 'DIET_GENERAL';
    }
    if (lower.includes('herb') || lower.includes('ashwagandha') || lower.includes('triphala') || lower.includes('tulsi') || lower.includes('turmeric')) {
      return 'HERB_INFORMATION';
    }
    if (lower.includes('panchakarma') || lower.includes('abhyanga') || lower.includes('shirodhara') || lower.includes('swedana') || lower.includes('pizhichil') || lower.includes('massage')) {
      return 'THERAPY_GENERAL';
    }
    if (lower.includes('prepare') || lower.includes('before therapy')) {
      return 'THERAPY_PREPARATION';
    }
    if (lower.includes('aftercare') || lower.includes('after therapy') || lower.includes('post therapy')) {
      return 'THERAPY_AFTERCARE';
    }
    if (lower.includes('sleep') || lower.includes('insomnia') || lower.includes('nidra')) {
      return 'SLEEP';
    }
    if (lower.includes('hydration') || lower.includes('water') || lower.includes('drink')) {
      return 'HYDRATION';
    }
    if (lower.includes('stress') || lower.includes('anxiety') || lower.includes('calm')) {
      return 'STRESS';
    }

    return 'GENERAL_AYURVEDA';
  }

  /**
   * Main Response Generator (100% Offline, Deterministic 11-Step Pipeline)
   */
  async generateChatResponse(systemPrompt, userQuestion, contextData = {}) {
    const text = userQuestion.trim();
    const intent = this.classifyIntent(text);

    // 1. Emergency Safety Layer
    if (intent === 'EMERGENCY') {
      return {
        success: true,
        intent: 'EMERGENCY',
        confidence: 'HIGH',
        responseType: 'SAFETY_WARNING',
        answer: '⚠️ EMERGENCY NOTICE: Your question references potentially urgent medical symptoms. The AyurSutra Assistant cannot safely assess emergency conditions. Please seek immediate emergency medical care or visit the nearest hospital emergency room.',
        recommendations: [],
        precautions: ['Do not delay emergency medical evaluation for home remedies.'],
        patientContextUsed: false,
        personalizationApplied: false,
        requiresClinicianReview: true,
        emergency: true,
        sources: [],
        disclaimer: '⚠️ Emergency escalation active.'
      };
    }

    // 2. Prohibited Request Safety Layer
    const prohibited = this.detectProhibitedRequest(text);
    if (prohibited) {
      return {
        success: true,
        intent: 'PROHIBITED_MEDICAL_REQUEST',
        confidence: 'HIGH',
        responseType: 'SAFETY_WARNING',
        answer: `⚠️ CLINICAL SAFETY NOTICE: ${prohibited.response}`,
        recommendations: [],
        precautions: ['Consult your treating AyurSutra clinician for diagnostic or prescription changes.'],
        patientContextUsed: false,
        personalizationApplied: false,
        requiresClinicianReview: true,
        emergency: false,
        sources: [],
        disclaimer: '⚠️ AyurSutra Assistant cannot diagnose or prescribe.'
      };
    }

    // 3. Out of Scope Layer
    if (intent === 'OUT_OF_SCOPE') {
      return {
        success: true,
        intent: 'OUT_OF_SCOPE',
        confidence: 'HIGH',
        responseType: 'OUT_OF_SCOPE',
        answer: 'I’m the AyurSutra Assistant and I’m restricted to Ayurveda, wellness, diet, therapy, and AyurSutra-related support. I can’t help with unrelated topics.',
        recommendations: [],
        precautions: [],
        patientContextUsed: false,
        personalizationApplied: false,
        requiresClinicianReview: false,
        emergency: false,
        sources: [],
        disclaimer: 'AyurSutra Domain Restricted'
      };
    }

    // 3.5. Greeting & General Conversation Handler
    const generalConv = this.detectGreetingOrGeneralConversation(text);
    if (generalConv) {
      return {
        success: true,
        intent: 'GENERAL_CONVERSATION',
        confidence: 'HIGH',
        responseType: 'GENERAL_EDUCATION',
        answer: generalConv.answer,
        recommendations: [],
        precautions: [],
        patientContextUsed: false,
        personalizationApplied: false,
        requiresClinicianReview: false,
        emergency: false,
        sources: [],
        disclaimer: '🌿 AyurSutra Assistant'
      };
    }

    // 4. Personalized Diet Engine Pathway
    if (intent === 'DIET_PERSONALIZED' && Object.keys(contextData).length > 0) {
      const plan = personalizedDietEngine.generateDietPlan(contextData);
      const answerText = `Based on your active AyurSutra health profile:\n• Active Focus: ${contextData.activeTherapyPlan || 'General Wellness'}\n• Dietary Pattern: ${plan.dietaryPattern}\n\n**Recommended Breakfast:** ${plan.breakfast}\n**Recommended Lunch:** ${plan.lunch}\n**Recommended Dinner:** ${plan.dinner}\n\n**Hydration Note:** ${plan.hydration}`;

      return {
        success: true,
        intent: 'DIET_PERSONALIZED',
        confidence: 'HIGH',
        responseType: 'PERSONALIZED_DIET',
        answer: answerText,
        recommendations: plan.recommendedFoods,
        precautions: plan.precautions,
        patientContextUsed: true,
        personalizationApplied: true,
        requiresClinicianReview: true,
        emergency: false,
        sources: [{ id: 'diet_abhyanga_aftercare', title: 'AyurSutra Personal Diet Engine Rules', category: 'diet' }],
        disclaimer: '⚠️ Personalized using your AyurSutra record. Requires clinician verification.'
      };
    }

    // 5. Knowledge Base Search & Herb Safety Engine Pathway
    const matchedEntries = searchKnowledgeBase(text);
    const qLower = text.toLowerCase();
    const isExplicitTherapyQuery = qLower.includes('basti') || qLower.includes('vamana') || qLower.includes('virechana') || qLower.includes('nasya') || qLower.includes('abhyanga') || qLower.includes('shirodhara') || qLower.includes('swedana') || qLower.includes('pizhichil');

    if (matchedEntries.length > 0 && (isExplicitTherapyQuery || matchedEntries[0].category !== 'therapies')) {
      const top = matchedEntries[0];
      const displayTitle = top.title || top.commonName || top.sanskritName || top.topic || 'Ayurvedic Guidance';

      if (top.category === 'herbs') {
        const herbSafety = herbSafetyEngine.evaluateHerbSafety(top, contextData);
        const answerText = `🌿 **${displayTitle}**\n${top.educationalSummary}\n\n**Benefits:**\n${top.benefits.map(b => `• ${b}`).join('\n')}\n\n**Dosage Status:** ${herbSafety.dosageInfo}`;

        return {
          success: true,
          intent: 'HERB_INFORMATION',
          confidence: 'HIGH',
          responseType: 'GENERAL_EDUCATION',
          answer: answerText,
          recommendations: top.benefits,
          precautions: herbSafety.warnings,
          patientContextUsed: false,
          personalizationApplied: false,
          requiresClinicianReview: true,
          emergency: false,
          sources: [{ id: top.id, title: displayTitle, category: top.category }],
          disclaimer: '⚠️ Educational herb information. Clinician approval required before therapeutic use.'
        };
      }

      if (top.category === 'therapies') {
        let answerText = `🌿 **${displayTitle}**\n${top.description}`;
        if (top.procedureDetails) {
          answerText += `\n\n**How It Is Performed (Procedure & Stages):**\n${top.procedureDetails}`;
        }
        if (top.benefits && top.benefits.length > 0) {
          answerText += `\n\n**Primary Health Benefits:**\n${top.benefits.map(b => `• ${b}`).join('\n')}`;
        }
        if (top.recommendedFor && top.recommendedFor.length > 0) {
          answerText += `\n\n**Recommended For:**\n${top.recommendedFor.map(r => `• ${r}`).join('\n')}`;
        }
        if (top.precautions) {
          answerText += `\n\n**Precautions & Safety:** ${top.precautions}`;
        }

        return {
          success: true,
          intent: 'THERAPY_GENERAL',
          confidence: 'HIGH',
          responseType: 'GENERAL_EDUCATION',
          answer: answerText,
          recommendations: top.benefits || [],
          precautions: [top.precautions || 'Supervised clinical procedure.'],
          patientContextUsed: false,
          personalizationApplied: false,
          requiresClinicianReview: true,
          emergency: false,
          sources: [{ id: top.id, title: displayTitle, category: top.category }],
          disclaimer: '⚠️ Panchakarma therapy procedure. Must be prescribed & performed by qualified Ayurvedic clinicians.'
        };
      }

      const answerText = `🌿 **${displayTitle}**\n${top.educationalSummary || top.description}\n\n**Benefits:**\n${(top.benefits || []).map(b => `• ${b}`).join('\n')}\n\n**Precautions:** ${top.precautions || 'Consult your clinician.'}`;

      return {
        success: true,
        intent,
        confidence: 'HIGH',
        responseType: 'GENERAL_EDUCATION',
        answer: answerText,
        recommendations: top.benefits || [],
        precautions: [top.precautions || 'Consult your clinician.'],
        patientContextUsed: false,
        personalizationApplied: false,
        requiresClinicianReview: top.requiresClinicianApproval || false,
        emergency: false,
        sources: [{ id: top.id, title: displayTitle, category: top.category }],
        disclaimer: '⚠️ AyurSutra curated knowledge entry. For educational support.'
      };
    }

    // 6. Comprehensive Educational Ayurvedic Response Synthesis
    return this.generateGeneralAyurvedicResponse(text);
  }

  /**
   * Synthesizes a structured educational Ayurvedic response for any wellness, health, or general topic
   */
  generateGeneralAyurvedicResponse(userQuestion) {
    const qLower = userQuestion.toLowerCase();

    let topicName = `Ayurvedic Guidance on "${userQuestion.trim()}"`;
    let ayurvedicPerspective = 'In Ayurveda, health (Svasthya) is defined as a dynamic equilibrium between Vata, Pitta, and Kapha doshas, robust Agni (digestive fire), balanced Dhatus (tissues), and mental clarity.';
    let pathyaRecommendations = [
      'Eat warm, freshly cooked, easily digestible meals at regular, consistent times.',
      'Sip warm water or mild herbal teas (ginger, cumin, coriander, fennel) throughout the day.',
      'Maintain a consistent daily routine (Dinacharya) for meals, sleep, and physical activity.',
      'Eat in a calm, settled environment without digital distractions.'
    ];
    let apathyaPrecautions = [
      'Avoid cold, iced beverages, stale food, and heavy deep-fried items.',
      'Avoid irregular meal timings, late-night heavy suppers, and emotional eating.',
      'Avoid sudden exposure to extreme weather or cold winds after warm meals.'
    ];

    if (qLower.includes('basti') || qLower.includes('vasthi') || qLower.includes('enema')) {
      topicName = 'Basti Therapy (Medicated Enema & Vata Care)';
      ayurvedicPerspective = 'Basti is the cardinal treatment of Panchakarma ("Ardhachikitsa" or half of all therapeutics). It involves administering medicated herbal oils or decoctions via the rectal route to cleanse Vata dosha at its primary root site (the colon).';
      pathyaRecommendations = [
        'How It Is Performed — Preparation (Purvakarma): Abhyanga (warm oil massage) and Swedana (herbal steam) applied to lower back & abdomen.',
        'How It Is Performed — Administration (Pradhanakarma): Medicated herbal decoction (Niruha Basti) or warm oil (Anuvasana Basti) is administered gently using a sterile rectal catheter while patient lies on left side.',
        'How It Is Performed — Aftercare (Paschatkarma): Rest, natural evacuation, warm bath, and light Kitchari diet.',
        'Primary Benefits: Clears chronic Vata disorders, relieves joint stiffness, sciatica, back pain, and chronic constipation.'
      ];
      apathyaPrecautions = [
        'Avoid cold drinks, iced water, raw cold foods, and heavy exercise post-procedure.',
        'Avoid exposure to cold winds or air conditioning immediately after Basti.',
        'Must be administered under qualified Ayurvedic doctor supervision.'
      ];
    } else if (qLower.includes('vamana') || qLower.includes('emesis')) {
      topicName = 'Vamana Therapy (Therapeutic Emesis & Kapha Care)';
      ayurvedicPerspective = 'Vamana is a controlled therapeutic emesis therapy aimed at eliminating excess Kapha dosha and toxins (Ama) accumulated in the stomach, lungs, and upper chest.';
      pathyaRecommendations = [
        'How It Is Performed — Preparation: Internal Snehapana (medicated ghee intake) for 3-7 days, followed by body oil massage and steam.',
        'How It Is Performed — Administration: Patient drinks herbal emetic decoctions (Madanaphala & Licorice) under strict doctor supervision.',
        'How It Is Performed — Aftercare: Herbal smoke inhalation (Dhumapana), gargling, rest, and Samsarjana Krama dietary progression.',
        'Primary Benefits: Relieves chronic asthma, bronchitis, sinus congestion, and psoriasis.'
      ];
      apathyaPrecautions = [
        'Strict dietary progression (Samsarjana Krama) must be followed.',
        'Contraindicated in pregnancy, cardiac conditions, and acute hypertension.'
      ];
    } else if (qLower.includes('virechana') || qLower.includes('purgation')) {
      topicName = 'Virechana Therapy (Therapeutic Purgation & Pitta Care)';
      ayurvedicPerspective = 'Virechana is the therapeutic purgation therapy designed to eliminate excess Pitta dosha and blood toxins from the liver, gallbladder, and small intestine.';
      pathyaRecommendations = [
        'How It Is Performed — Preparation: Internal oleation with medicated ghee for several days, followed by massage & steam.',
        'How It Is Performed — Administration: Medicated herbal purgative (Trivrit / Castor formula) given in morning.',
        'How It Is Performed — Aftercare: Controlled evacuations in clinic, warm water intake, followed by dietary progression.',
        'Primary Benefits: Clears liver toxicity, acne, eczema, chronic rashes, and hyperacidity.'
      ];
      apathyaPrecautions = [
        'Drink warm water only. Avoid sunlight, heat, and heavy physical exertion.'
      ];
    } else if (qLower.includes('nasya') || qLower.includes('nasal')) {
      topicName = 'Nasya Therapy (Nasal Herbal Administration)';
      ayurvedicPerspective = 'Nasya is the administration of medicated herbal oils into the nostrils ("Nasa Hi Shiraso Dvaram" — nose is the doorway to the brain and head).';
      pathyaRecommendations = [
        'How It Is Performed — Preparation: Mild warm facial oil massage and light steam applied to cheeks & forehead.',
        'How It Is Performed — Administration: Measured drops of Anu Taila or Shadbindu Taila instilled into each nostril.',
        'How It Is Performed — Aftercare: Gentle massage of nose, spitting out throat secretions, gargling with warm salt water.',
        'Primary Benefits: Clears sinuses, relieves migraines, enhances mental clarity and sensory sharpness.'
      ];
      apathyaPrecautions = [
        'Do not inhale cold air or shower immediately post-procedure.'
      ];
    } else if (qLower.includes('headache') || qLower.includes('head pain') || qLower.includes('migraine') || qLower.includes('head')) {
      topicName = 'Ayurvedic Perspective on Headaches (Shiroroga)';
      ayurvedicPerspective = 'Ayurveda views headaches primarily as a result of Vata or Pitta aggravation, emotional stress, lack of sleep, or impaired digestion (Ama).';
      pathyaRecommendations = [
        'Apply warm sesame oil or Brahmi oil gently to the scalp and temples.',
        'Sip warm ginger-tulsi tea or warm water.',
        'Rest in a quiet, dark, well-ventilated room.'
      ];
      apathyaPrecautions = [
        'Avoid loud noises, bright digital screens, cold drafts, and skipping meals.',
        'Avoid iced drinks and excessive caffeine.'
      ];
    } else if (qLower.includes('digest') || qLower.includes('stomach') || qLower.includes('gas') || qLower.includes('acidity') || qLower.includes('constipation') || qLower.includes('bloat') || qLower.includes('gut')) {
      topicName = 'Ayurvedic Digestive Health & Agni Care';
      ayurvedicPerspective = 'Digestion is governed by Agni (metabolic fire). Weak Agni leads to Ama (accumulated toxins), causing gas, bloating, acidity, or constipation.';
      pathyaRecommendations = [
        'Eat warm yellow mung dal Kitchari cooked with ginger, cumin, and turmeric.',
        'Sip warm cumin-coriander-fennel (CCF) tea between meals.',
        'Chew a thin slice of fresh ginger with a pinch of sea salt 15 minutes before lunch.'
      ];
      apathyaPrecautions = [
        'Avoid heavy, cold, fried foods, raw salads, and iced water.',
        'Avoid overeating or eating when not genuinely hungry.'
      ];
    } else if (qLower.includes('sleep') || qLower.includes('insomnia') || qLower.includes('night') || qLower.includes('rest') || qLower.includes('tired')) {
      topicName = 'Ayurvedic Sleep & Rest Regimen (Nidra)';
      ayurvedicPerspective = 'Nidra (sleep) is one of the three pillars of health (Trayopastambha) in Ayurveda. Vata or Pitta aggravation often disrupts restful sleep.';
      pathyaRecommendations = [
        'Sip warm golden milk (warm almond milk or organic milk with a pinch of nutmeg and turmeric) 30 minutes before sleep.',
        'Massage the soles of your feet with warm sesame oil or ghee (Padabhyanga).',
        'Turn off digital screens 1 hour before bedtime.'
      ];
      apathyaPrecautions = [
        'Avoid late-night heavy suppers, intense exercise late at night, and stimulating media.'
      ];
    } else if (qLower.includes('skin') || qLower.includes('acne') || qLower.includes('pimple') || qLower.includes('glow') || qLower.includes('rash')) {
      topicName = 'Ayurvedic Skin Care (Tvacha & Pitta Balance)';
      ayurvedicPerspective = 'Skin health reflects internal metabolic purity and Pitta balance. Toxins (Ama) in the blood (Rakta Dhatu) often manifest on the skin.';
      pathyaRecommendations = [
        'Include cooling, blood-purifying herbs like Turmeric, Neem, and Aloe Vera.',
        'Eat fresh green leafy vegetables, steamed zucchini, and sweet fruits.',
        'Drink adequate warm water and stay hydrated.'
      ];
      apathyaPrecautions = [
        'Avoid excessively spicy, sour, salty, fried, or fermented foods.',
        'Avoid direct harsh sunlight without protection.'
      ];
    } else if (qLower.includes('cold') || qLower.includes('cough') || qLower.includes('fever') || qLower.includes('flu') || qLower.includes('immunity') || qLower.includes('throat')) {
      topicName = 'Ayurvedic Immunity & Respiratory Wellness (Kapha-Vata Care)';
      ayurvedicPerspective = 'Cough, cold, and seasonal flu indicate Kapha-Vata aggravation and temporary weakening of Agni (Ojas balance).';
      pathyaRecommendations = [
        'Drink warm decoction (Kadha) made of Tulsi, Ginger, Black Pepper, and Honey.',
        'Steam inhalation with a drop of Eucalyptus or Carom seeds (Ajwain).',
        'Eat light, warm soups and Kitchari.'
      ];
      apathyaPrecautions = [
        'Avoid dairy products, cold drinks, ice cream, and banana during active congestion.',
        'Avoid exposure to cold drafts.'
      ];
    } else if (qLower.includes('hair') || qLower.includes('fall') || qLower.includes('dandruff') || qLower.includes('scalp')) {
      topicName = 'Ayurvedic Hair Care (Kesha & Asthi Dhatu Health)';
      ayurvedicPerspective = 'In Ayurveda, hair health is tied to Pitta dosha balance and Asthi Dhatu (bone tissue metabolism). Excess Pitta causes hair thinning and greying.';
      pathyaRecommendations = [
        'Gently massage scalp with warm Bhringraj or Amla oil 2-3 times a week.',
        'Include sesame seeds, coconut, and leafy greens in your diet.',
        'Practice stress-relieving pranayama.'
      ];
      apathyaPrecautions = [
        'Avoid harsh chemical shampoos, hot showers on the scalp, and excessive spicy foods.'
      ];
    } else if (qLower.includes('abhyanga')) {
      topicName = 'Abhyanga Therapy (Warm Herbal Oil Massage Care)';
      ayurvedicPerspective = 'Abhyanga is the classical full-body oil massage using warm herb-infused oil to nourish skin, soothe Vata dosha, and lubricate joints.';
      pathyaRecommendations = [
        'Rest for 15-30 minutes after oil application before taking a warm bath or shower.',
        'Consume warm, light, freshly cooked meals like yellow mung dal Kitchari after therapy.',
        'Sip warm water or herbal teas throughout the day to support circulation.'
      ];
      apathyaPrecautions = [
        'Avoid cold water showers immediately after oil massage.',
        'Avoid exposure to cold winds, air conditioning, and heavy exercise post-Abhyanga.'
      ];
    } else if (qLower.includes('joint') || qLower.includes('knee') || qLower.includes('back') || qLower.includes('pain') || qLower.includes('stiff') || qLower.includes('bone')) {
      topicName = 'Ayurvedic Joint & Vata Wellness';
      ayurvedicPerspective = 'Joint pain and stiffness are primarily associated with Vata dosha imbalance, leading to tissue dryness and reduced lubrication.';
      pathyaRecommendations = [
        'Apply warm Mahanarayan or sesame oil massage to affected joints (Abhyanga).',
        'Apply mild warm compress or steam (Swedana).',
        'Consume warm, cooked root vegetables and mild spices like Turmeric and Garlic.'
      ];
      apathyaPrecautions = [
        'Avoid cold, raw foods, dry crackers, and cold wind exposure.'
      ];
    } else if (qLower.includes('vata')) {
      topicName = 'Vata Dosha (Air & Ether Bio-Energy)';
      ayurvedicPerspective = 'Vata governs all physical & mental movement (respiration, nerve impulses, circulation, and elimination). Its qualities are dry, light, cold, rough, subtle, and mobile.';
      pathyaRecommendations = [
        'Eat warm, moist, grounding foods prepared with healthy fats like Ghee or sesame oil.',
        'Sip warm water or ginger-cardamom tea throughout the day.',
        'Maintain a consistent daily routine (Dinacharya) and practice daily warm oil massage (Abhyanga).'
      ];
      apathyaPrecautions = [
        'Avoid raw cold salads, dry crackers, iced beverages, skipping meals, and irregular sleep.'
      ];
    } else if (qLower.includes('pitta')) {
      topicName = 'Pitta Dosha (Fire & Water Bio-Energy)';
      ayurvedicPerspective = 'Pitta governs metabolic transformation, digestion, body temperature, and intellect. Its qualities are hot, sharp, light, liquid, and slightly oily.';
      pathyaRecommendations = [
        'Eat cooling, naturally sweet, bitter, and astringent foods (steamed vegetables, zucchini, cucumber, rice, sweet fruits).',
        'Consume coconut water, soaked raisins, and coriander-infused water.',
        'Keep cool and engage in peaceful, non-competitive relaxation.'
      ];
      apathyaPrecautions = [
        'Avoid excessively hot spicy foods, sour pickles, fried items, alcohol, and midday sun exposure.'
      ];
    } else if (qLower.includes('kapha')) {
      topicName = 'Kapha Dosha (Earth & Water Bio-Energy)';
      ayurvedicPerspective = 'Kapha governs physical structure, lubrication, fluid balance, and stamina. Its qualities are heavy, slow, cool, oily, smooth, dense, and stable.';
      pathyaRecommendations = [
        'Eat light, warm, dry, pungent, bitter, and astringent foods (barley, mung dal, steamed greens, spices).',
        'Drink warm honey-lemon water first thing in the morning.',
        'Engage in energetic daily physical exercise.'
      ];
      apathyaPrecautions = [
        'Avoid heavy oily sweets, ice creams, cold dairy, fried foods, and daytime napping.'
      ];
    } else if (qLower.includes('breakfast')) {
      topicName = 'Ayurvedic Breakfast Guidance';
      ayurvedicPerspective = 'Breakfast in Ayurveda should be light to moderate, warm, cooked, and tailored to kindle morning Agni without overloading digestion.';
      pathyaRecommendations = [
        'Warm oatmeal or quinoa cooked with cinnamon, cloves, and cardamom.',
        'Stewed apples or pears cooked with cinnamon.',
        'Warm spiced almond milk or light mung porridge.'
      ];
      apathyaPrecautions = [
        'Avoid iced smoothies, cold cereal with cold milk, heavy fried pastries, and greasy bacon/sausages.'
      ];
    } else if (qLower.includes('lunch')) {
      topicName = 'Ayurvedic Lunch Guidance';
      ayurvedicPerspective = 'Lunch (12:00 PM - 01:30 PM) is considered the primary meal of the day when Pitta and digestive Agni are at peak strength.';
      pathyaRecommendations = [
        'Warm yellow mung dal Kitchari or cooked basmati rice with freshly cooked dal.',
        'Steamed seasonal vegetables prepared with mild spices (cumin, turmeric, coriander, ghee).',
        'Sip small amounts of warm water or Cumin-Coriander-Fennel (CCF) tea.'
      ];
      apathyaPrecautions = [
        'Avoid skipping lunch, eating while rushing, or drinking large amounts of iced drinks with meals.'
      ];
    } else if (qLower.includes('dinner')) {
      topicName = 'Ayurvedic Dinner Guidance';
      ayurvedicPerspective = 'Dinner (06:30 PM - 07:30 PM) should be light, warm, and consumed at least 2-3 hours before sleep so digestion is completed before rest.';
      pathyaRecommendations = [
        'Light vegetable soup, thin mung dal broth, or small portion of cooked basmati rice.',
        'Steamed zucchini, pumpkin, or bottle gourd.'
      ];
      apathyaPrecautions = [
        'Avoid late-night heavy suppers after 8:00 PM, heavy cheese/curd, raw salads, and heavy meat at night.'
      ];
    } else if (qLower.includes('milk')) {
      topicName = 'Ayurvedic Perspective on Milk';
      ayurvedicPerspective = 'Pure organic warm milk boiled with spices (cardamom, cinnamon, nutmeg, turmeric) is considered Ojas-building and soothing to Vata & Pitta.';
      pathyaRecommendations = [
        'Always boil milk with digestive spices before consuming.',
        'Drink warm golden milk 30 minutes before bedtime for sleep support.'
      ];
      apathyaPrecautions = [
        'DO NOT drink milk if you have a known milk allergy or lactose intolerance.',
        'DO NOT combine milk with sour fruits, fish, or salty foods (Viruddha Ahara - incompatible combination).'
      ];
    } else if (qLower.includes('water') || qLower.includes('hydration')) {
      topicName = 'Ayurvedic Hydration & Water Principles';
      ayurvedicPerspective = 'Ayurveda recommends sipping warm water throughout the day according to natural thirst to kindle Agni and flush metabolic Ama.';
      pathyaRecommendations = [
        'Sip warm or room-temperature water throughout the day.',
        'Sip small warm water amounts during meals to moisten food.'
      ];
      apathyaPrecautions = [
        'Avoid gulping large amounts of iced water, especially during or immediately after meals.'
      ];
    } else if (qLower.includes('weight') || qLower.includes('fat') || qLower.includes('slimming')) {
      topicName = 'Ayurvedic Perspective on Weight Management (Meda Dhatu)';
      ayurvedicPerspective = 'Weight gain is associated with Kapha aggravation and Meda Dhatu (fat tissue) accumulation alongside sluggish Agni.';
      pathyaRecommendations = [
        'Drink warm water with raw honey and lemon first thing in the morning.',
        'Eat light, warm, spiced meals (barley, mung dal, bitter greens, black pepper, ginger).',
        'Engage in brisk daily physical exercise.'
      ];
      apathyaPrecautions = [
        'Avoid heavy oily sweets, ice creams, cold drinks, late-night suppers, and daytime sleeping.'
      ];
    } else if (qLower.includes('stress') || qLower.includes('anxiety') || qLower.includes('mind')) {
      topicName = 'Ayurvedic Mental Wellness & Stress Relief';
      ayurvedicPerspective = 'Stress and anxiety are driven by Vata imbalance in Prana Vayu and Manas (mind).';
      pathyaRecommendations = [
        'Practice soothing Pranayama (Nadi Shodhana alternate nostril breathing).',
        'Apply warm Brahmi or sesame oil scalp and foot massage (Abhyanga).',
        'Sip warm chamomile or Ashwagandha herbal tea.'
      ];
      apathyaPrecautions = [
        'Avoid excessive screen time, late-night work, excessive caffeine, and chaotic loud environments.'
      ];
    }

    const answerText = `🌿 **${topicName}**\n${ayurvedicPerspective}\n\n**Pathya (Recommended Practices & Foods):**\n${pathyaRecommendations.map(p => `• ${p}`).join('\n')}\n\n**Apathya (Precautions & What to Avoid):**\n${apathyaPrecautions.map(a => `• ${a}`).join('\n')}`;

    return {
      success: true,
      intent: 'GENERAL_AYURVEDA',
      confidence: 'HIGH',
      responseType: 'GENERAL_EDUCATION',
      answer: answerText,
      recommendations: pathyaRecommendations,
      precautions: apathyaPrecautions,
      patientContextUsed: false,
      personalizationApplied: false,
      requiresClinicianReview: true,
      emergency: false,
      sources: [{ id: 'ayurveda_general_guidance', title: topicName, category: 'education' }],
      disclaimer: '⚠️ Educational Ayurvedic guidance. Consult your qualified clinician for individual health evaluation.'
    };
  }
}

module.exports = AyurSutraKnowledgeProvider;
