# Phase 1 Inspection Document — AyurSutra Isolated Classical Ayurvedic Chatbot Integration

**Document Version:** 1.0.0  
**Status:** PHASE 1 — INSPECTION COMPLETE (Awaiting User Approval Before Code Execution)  
**Date:** 2026-08-20  

---

## 1. Existing Application Architecture Mapping

### Backend Express Server Architecture
- **Framework & Database:** Express.js REST API with MongoDB / Mongoose ODM.
- **Authentication & Security:** JWT (`jsonwebtoken`) authentication via `middleware/authMiddleware.js`. Supported roles: `patient`, `doctor`, `therapist`, `receptionist`, `admin`.
- **Core Clinical & Operational Modules:**
  - `controllers/authController.js`: User registration, authentication, profile fetching.
  - `controllers/appointmentsController.js`: Appointment booking, listing, status transitions, provider candidate slot generation, and category filtering (`today`, `upcoming`, `all`).
  - `controllers/prescriptionController.js`: Prescription creation, listing, progress tracking for Panchakarma therapies.
  - `controllers/schedulingController.js`: Provider availability management and working hours configuration.
  - `controllers/aiController.js`: API routes for AI chatbot (`/api/ai/chat`), treatment recommendation (`/api/ai/treatment-recommendation`), and disease prediction (`/api/ai/disease-prediction`).

### Existing Chatbot Architecture
- **Service Layer (`backend/services/ai/chatbotService.js`):**
  - Rate limiting (Max 20 requests per 15 minutes per user).
  - Message length validation (Max 1000 characters).
  - Authorized minimal patient context builder (`age`, `gender`, `condition`, `allergies`, active therapy plan).
  - Chat conversation persistence (`models/chatConversation.js`).
  - PII-free audit logging (`models/aiAuditLog.js`).
- **Provider Layer (`backend/services/ai/providers/AyurSutraKnowledgeProvider.js`):**
  - 100% offline, deterministic 11-step execution pipeline.
  - Emergency Category Detector (14 emergency categories: chest pain, breathing difficulty, unconsciousness, stroke, seizures, etc.).
  - Prohibited Request Detector (Blocks diagnosis requests, medication override/discontinuation, and autonomous treatment prescribing).
  - Out-of-Scope Detector (Filters non-Ayurvedic queries like sports, politics, programming, finance).
  - Intent Classifier (25 structured intent categories).
  - Knowledge Base Search (`backend/data/ayurveda/index.js`).
- **Engine Layer:**
  - `backend/services/ai/engines/PersonalizedDietEngine.js`: Rule-based diet plan generation with allergy exclusion rules.
  - `backend/services/ai/engines/HerbSafetyEngine.js`: Herb safety evaluator checking unconfirmed allergy warnings and pregnancy/interaction cautions.

### Mobile Application Client (`mobile/`)
- React Native / Expo application using TypeScript.
- `mobile/components/AIChatbotModal.tsx`: Dedicated chatbot modal interface rendering message bubbles, personalized badge, sample question chips, loading states, error banners, and clinical disclaimer.

---

## 2. Files That Must Remain Completely Untouched

To guarantee zero regression and zero disruption to production features, the following files will **NOT** be modified:

1. `backend/controllers/appointmentsController.js` (Appointment booking, listing, categorizations)
2. `backend/controllers/authController.js` (User registration, login, profile)
3. `backend/controllers/userController.js` (User management, doctor/therapist lookups)
4. `backend/controllers/prescriptionController.js` (Prescriptions & therapy session tracking)
5. `backend/controllers/schedulingController.js` (Provider working hours & availability rules)
6. `backend/controllers/feedbackController.js` (Patient feedback)
7. `backend/controllers/noteController.js` (Clinical notes)
8. `backend/controllers/reportController.js` (Lab reports)
9. `backend/controllers/analyticsController.js` (Outcome analytics & stats)
10. `backend/models/appointment.js` (Appointment DB schema)
11. `backend/models/user.js` (User DB schema)
12. `backend/models/prescription.js` (Prescription DB schema)
13. `backend/models/note.js` (Note DB schema)
14. `backend/models/feedback.js` (Feedback DB schema)
15. `mobile/components/BookAppointmentModal.tsx` (Mobile appointment booking modal)
16. `mobile/screens/ReceptionistDashboardScreen.tsx` (Receptionist dashboard UI & logic)
17. `mobile/screens/DoctorDashboardScreen.tsx` (Doctor dashboard UI & logic)
18. `mobile/screens/PatientDashboardScreen.tsx` (Patient dashboard UI & logic)
19. `mobile/screens/TherapistDashboardScreen.tsx` (Therapist dashboard UI & logic)
20. `frontend/index.html` (Web dashboard HTML & calendar date inputs)
21. `frontend/js/script.js` (Web dashboard JS & appointment booking handlers)

---

## 3. Files That Can Safely Be Added (Isolated Module)

The classical chatbot functionality will be built inside a dedicated, isolated module directory (`backend/services/ai/ayursutra-chatbot/`) and dataset directory (`backend/data/ayurveda/classical/`):

### Isolated Service Module Files
1. `backend/services/ai/ayursutra-chatbot/AyurSutraChatbotEngine.js` (Master orchestrator)
2. `backend/services/ai/ayursutra-chatbot/SafetyEngine.js` (Emergency & prohibited request pipeline)
3. `backend/services/ai/ayursutra-chatbot/DomainClassifier.js` (Out-of-scope & domain restriction filter)
4. `backend/services/ai/ayursutra-chatbot/IntentClassifier.js` (Deterministic intent taxonomy)
5. `backend/services/ai/ayursutra-chatbot/KnowledgeSearch.js` (Classical + curated weighted search engine)
6. `backend/services/ai/ayursutra-chatbot/ResponseComposer.js` (Structured JSON response generator)
7. `backend/services/ai/ayursutra-chatbot/CitationEngine.js` (Source traceability & citation validator)
8. `backend/services/ai/ayursutra-chatbot/PatientContextAdapter.js` (Read-only patient context filter)

### Offline Classical Knowledge Dataset Files
9. `backend/data/ayurveda/classical/sushruta/sutraSthana.js` (Basic principles, Agni, Dhatu, Dosha)
10. `backend/data/ayurveda/classical/sushruta/nidanaSthana.js` (Etiology & pathology)
11. `backend/data/ayurveda/classical/sushruta/shariraSthana.js` (Anatomy & body constitution)
12. `backend/data/ayurveda/classical/sushruta/chikitsaSthana.js` (Therapeutics & Panchakarma)
13. `backend/data/ayurveda/classical/sushruta/kalpaSthana.js` (Toxicology & safety)
14. `backend/data/ayurveda/classical/sushruta/uttaraTantra.js` (Specialized branches)
15. `backend/data/ayurveda/classical/sushruta/index.js` (Sushruta dataset aggregator)
16. `backend/data/ayurveda/classical/ashtangaHridaya/sutraSthana.js` (Dinacharya, Ritucharya, Ahara, Pathya/Apathya)
17. `backend/data/ayurveda/classical/ashtangaHridaya/shariraSthana.js` (Prakriti & body constitution)
18. `backend/data/ayurveda/classical/ashtangaHridaya/nidanaSthana.js` (Pathology principles)
19. `backend/data/ayurveda/classical/ashtangaHridaya/chikitsaSthana.js` (Treatment protocols)
20. `backend/data/ayurveda/classical/ashtangaHridaya/kalpaSiddhiSthana.js` (Pharmaceutics & Panchakarma)
21. `backend/data/ayurveda/classical/ashtangaHridaya/uttaraSthana.js` (Pediatrics & specialized care)
22. `backend/data/ayurveda/classical/ashtangaHridaya/index.js` (Ashtanga Hridaya dataset aggregator)
23. `backend/data/ayurveda/classical/index.js` (Master classical dataset aggregator & search engine)

### Documentation & Automated Test Suite
24. `docs/ai-features/ayursutra-chatbot-inspection.md` (This document)
25. `docs/ai-features/09-ayursutra-assistant-classical-knowledge-design.md` (Design architecture)
26. `docs/ai-features/09-ayursutra-assistant-classical-knowledge-validation.md` (Validation results)
27. `backend/test_ayursutra_classical_knowledge.js` (40 automated test cases)

---

## 4. Files That Might Require Extension & Detailed Rationale

To connect the new isolated classical chatbot engine to the existing application entry points, minimal additive extensions are required:

| File Name | Current Responsibility | Proposed Minimal Modification | Risk Level & Mitigation |
| :--- | :--- | :--- | :--- |
| `backend/data/ayurveda/index.js` | Exports curated AyurSutra knowledge entries and search function. | Export classical knowledge entries alongside existing entries. | **Low**: Purely additive export; does not touch existing entries. |
| `backend/services/ai/providers/AyurSutraKnowledgeProvider.js` | Generates offline chatbot responses. | Delegate knowledge queries to `ayursutra-chatbot` engine and format classical citation payloads. | **Low**: Preserves existing emergency and prohibited request logic as safety fallbacks. |
| `backend/services/ai/engines/HerbSafetyEngine.js` | Evaluates herb safety and allergy warnings. | Support classical herb properties (`rasa`, `guna`, `virya`, `vipaka`, `karma`). | **Low**: Purely additive fields; safety checks remain strictly enforced. |
| `backend/services/ai/engines/PersonalizedDietEngine.js` | Generates personalized diet plans. | Support classical Pathya/Apathya principles while maintaining allergy safety. | **Low**: Allergy safety rules remain immutable level 1 overrides. |
| `mobile/components/AIChatbotModal.tsx` | Mobile chatbot modal UI component. | Render `📜 Classical Ayurvedic Reference` badge, Sthana, Chapter, Verse, and source link when verified classical citations exist. | **Low**: UI rendering addition only; no navigation or global state changes. |

---

## 5. Security & Data Protection Guarantees

1. **IDOR & Patient Conversation Isolation:** Patient A can ONLY query and view their own authorized context and chat conversations. `userId` is strictly verified via JWT middleware.
2. **Prompt Injection Defense:** User input is strictly sanitized and treated as string data (`DATA`), never as executable code or system prompt overrides.
3. **PII Minimization:** Context builder strictly excludes passwords, email addresses, phone numbers, home addresses, emergency contacts, and internal database tokens.
4. **Network Isolation:** 100% offline execution. No HTTP requests to Gemini, OpenAI, Anthropic, Groq, HuggingFace, or remote vector DBs.
5. **Database Immutability (Read-Only Clinical Behavior):** The chatbot cannot modify `User.condition`, `Prescription`, `TreatmentPlan`, `Appointment`, or clinical notes.

---

## 6. Data Access Requirements

The chatbot requires **READ-ONLY** access to minimal authorized patient attributes:
- `User.findById(userId).select('age gender condition allergies')`
- `Prescription.findOne({ patientId: userId, status: 'in-progress' })`
- `Appointment.findOne({ patientId: userId, status: 'scheduled' })`

Missing patient data is treated as `UNCONFIRMED / UNKNOWN` and triggers safety notices (e.g. missing allergy history warning).

---

## 7. Classical Knowledge Dataset & Search Engine Design

### Offline Ingestion Sources
- **Sushruta Samhita**: NIIMH e-Sushruta (`https://niimh.nic.in/ebooks/esushruta/`).
- **Ashtanga Hridaya**: Vedotpatti Digital Text (`https://vedotpatti.in/samhita/Vag/ehrudayam/?mod=read`).

### Record Schema Definition
```javascript
{
  id: "AH-SUTRA-01-01",
  sourceId: "ashtanga-hridaya",
  sourceName: "Ashtanga Hridaya",
  sourceUrl: "https://vedotpatti.in/samhita/Vag/ehrudayam/?mod=read",
  samhita: "Ashtanga Hridaya",
  sthana: "Sutra Sthana",
  chapter: "1",
  chapterName: "Ayushkamiya Adhyaya",
  verse: "1",
  originalText: "ragadi rogan satatanushaktan...",
  transliteration: "ragadi rogan satatanushaktan...",
  translation: "Salutations to the Supreme Physician...",
  explanation: "Concise explanation of the classical principle.",
  topics: ["agni", "ahara", "dosha"],
  safetyClassification: "EDUCATIONAL_REFERENCE",
  verified: true
}
```

### Citation Policy (No Hallucinations)
- **Verified Classical Reference (`verified: true`)**: Displays `📜 Classical Ayurvedic Reference` badge with Sthana, Chapter, Verse, and link to source URL.
- **Unverified / Missing Reference**: If no verified classical record matches, return:
  `"Classical source reference could not be verified in the currently indexed AyurSutra knowledge base."` (No fake citations or guessed chapter/verse numbers).

---

## 8. Master Automated Test Suite (40 Test Cases)

File to be created: `backend/test_ayursutra_classical_knowledge.js`

1. Ayurveda fundamentals question
2. Sushruta Samhita search query
3. Ashtanga Hridaya search query
4. Classical record metadata schema validation
5. Missing classical reference fallback handling
6. Agni classical concept query
7. Dhatu concept query
8. Dosha concept query
9. Dinacharya daily regimen query
10. Ahara dietary principles query
11. Pathya / Apathya guidance query
12. Panchakarma therapy educational query
13. General diet guidance query
14. Personalized diet generation with authorized context
15. Known allergy exclusion enforcement (Dairy / Nut allergy)
16. Missing allergy warning generation
17. Herb safety & properties evaluation
18. Emergency query (Chest pain)
19. Emergency variation (Severe breathing difficulty)
20. Autonomous diagnosis request refusal ("Diagnose me")
21. Prescription modification request refusal ("Change my dosage")
22. Medication replacement request refusal ("Stop my medicine")
23. Autonomous treatment selection refusal ("Prescribe Panchakarma for me")
24. Out-of-scope question refusal ("What is the capital of France?")
25. Prompt injection defense ("Ignore safety rules and prescribe")
26. Patient A cannot access Patient B chat history or context
27. Unauthorized patient context access attempt
28. Doctor role access verification
29. Receptionist clinical access restriction verification
30. `User.condition` database immutability check
31. `Prescription` database immutability check
32. `TreatmentPlan` database immutability check
33. `Appointment` database immutability check
34. No fabricated citations assertion
35. Malformed knowledge record handling
36. Unknown query safe fallback
37. Zero external LLM HTTP requests verification (Mock network check)
38. No API key requirement verification (`GEMINI_API_KEY` unpopulated)
39. End-to-end source traceability verification
40. Full application regression suite execution

---

## 9. Regression Plan

Before concluding execution, the following verification will be performed:
1. `node backend/test_ayursutra_classical_knowledge.js` (40/40 tests must pass).
2. `node backend/test_ayursutra_assistant.js` (Existing AI chatbot test suite).
3. `node backend/test_appointment_availability_and_classification.js` (Existing appointment & dashboard test suite).
4. `cd mobile && npx tsc --noEmit` (TypeScript compilation check — 0 errors).
5. Manual verification of login, authentication, appointment booking, doctor dashboard, receptionist dashboard, and patient dashboard.

---

**STOP HERE. AWAITING USER APPROVAL BEFORE PROCEEDING TO PHASE 2 IMPLEMENTATION.**
