# 09 — AyurSutra Assistant (Intelligent Guidance Engine) Architecture & Safety Specification

## 1. Executive Summary & Zero External LLM Policy
The AyurSutra Assistant is a 100% self-contained, offline-capable, domain-restricted **Intelligent Guidance Engine**.

### 🚫 ABSOLUTE ARCHITECTURAL RULES
1. **NO GEMINI API / NO OPENAI / NO ANTHROPIC / NO EXTERNAL LLM API.**
2. **ZERO external network calls** to `generativelanguage.googleapis.com` or any external AI service.
3. Operates completely offline using **AyurSutra Domain Knowledge Base + Rule Engine + Context Engine**.
4. Does **NOT** autonomously diagnose diseases, prescribe medication, alter prescriptions, or modify patient records.
5. Directs out-of-scope questions (e.g. general trivia, finance, history) to a polite domain boundary notice.

---

## 2. 7-Layer Intelligent Engine Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Intent & Keyword Classification                              │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 2: Knowledge Base Matcher (backend/data/ayurveda/)               │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 3: Authorized Patient Context Retrieval                         │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 4: Emergency Pattern & Prohibited Action Filter                  │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 5: Diet & Herb Safety Recommendation Engine                      │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 6: Deterministic Response Composer                               │
├────────────────────────────────────────────────────────────────────────┤
│ Layer 7: Mandatory Clinical Safety & Disclaimer Layer                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Knowledge Base Structure (`backend/data/ayurveda/`)

Each entry in the knowledge base conforms to the strict schema:
```json
{
  "id": "diet_abhyanga_aftercare",
  "category": "diet",
  "topic": "post_therapy_nutrition",
  "title": "Post-Abhyanga Dietary Guidance",
  "description": "Warm, light, easily digestible meals such as Kitchari or warm vegetable soup.",
  "benefits": ["Supports Agni (digestive fire)", "Prevents ama formation post-massage"],
  "recommendedFor": ["Post-Abhyanga", "Post-Swedana"],
  "avoidWhen": ["High Ama states", "Acute indigestion"],
  "contraindications": ["Cold drinks", "Heavy fried foods", "Raw salads immediately post-therapy"],
  "precautions": "Hydrate with warm water or herbal tea.",
  "evidenceLevel": "Classical Ayurvedic Textual Record",
  "requiresClinicianApproval": false,
  "sourceType": "Curated Internal Knowledge Base"
}
```

---

## 4. Supported Intent Categories & Out-Of-Scope Boundary

- `DIET_QUERY`, `HERB_QUERY`, `THERAPY_QUERY`, `PANCHAKARMA_QUERY`, `LIFESTYLE_QUERY`
- `SLEEP_QUERY`, `STRESS_QUERY`, `HYDRATION_QUERY`
- `PATIENT_PLAN_QUERY`, `THERAPY_PROGRESS_QUERY`, `APPOINTMENT_PREPARATION`
- `GENERAL_AYURVEDA_QUERY`, `GENERAL_WELLNESS_QUERY`, `FOOD_RECOMMENDATION`, `FOOD_AVOIDANCE`
- `SAFETY_QUERY`, `EMERGENCY_QUERY`, `OUT_OF_SCOPE`

**Out-of-Scope Response:**
> *"I’m the AyurSutra Assistant and I’m restricted to Ayurveda, wellness, diet, therapy, and AyurSutra-related support. I can’t help with unrelated topics."*

---

## 5. Emergency Pattern System
Detects variations of: `chest pain`, `chest pressure`, `difficulty breathing`, `shortness of breath`, `unconscious`, `loss of consciousness`, `severe bleeding`, `seizure`, `anaphylaxis`, `severe allergic reaction`, `stroke-like symptoms`, `sudden weakness`, `self-harm`.

**Escalation Response:**
> *"⚠️ EMERGENCY NOTICE: Your question references potentially urgent medical symptoms. The AyurSutra Assistant cannot safely assess emergency conditions. Please seek immediate emergency medical care or visit the nearest hospital."*
