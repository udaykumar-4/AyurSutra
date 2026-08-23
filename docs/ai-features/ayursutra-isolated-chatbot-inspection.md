# Phase 1 Inspection Report — AyurSutra Fully Isolated Patient Chatbot Architecture

**Document Version:** 3.0.0  
**Status:** PHASE 1 COMPLETE — AWAITING EXPLICIT USER APPROVAL BEFORE PHASE 2 IMPLEMENTATION  
**Date:** 2026-08-20  

---

## 1. Complete System Architecture Inspection

### 1.1 Mobile & Web Client Architecture
- **Mobile Client:** Built with React Native, Expo, and TypeScript located in `mobile/`. Navigation is handled via Expo Router.
- **Web Client:** Single Page Application (HTML5 / ES6+) located in `frontend/`.
- **Existing Chatbot UI Component:** `mobile/components/AIChatbotModal.tsx` (Must remain 100% UNTOUCHED).

### 1.2 Backend API Architecture
- **Framework & Runtime:** Express.js on Node.js (v18+) running on port 5000.
- **Database:** MongoDB with Mongoose ODM.
- **Authentication & Authorization:** JWT bearer tokens verified by `middleware/authMiddleware.js`. Supported roles: `patient`, `doctor`, `therapist`, `receptionist`, `admin`.

### 1.3 Baseline Features & Models (Must Remain 100% Untouched)
- `User` Model & Auth Controller (`backend/models/user.js`, `backend/controllers/authController.js`)
- `Appointment` Model & Controller (`backend/models/appointment.js`, `backend/controllers/appointmentsController.js`)
- `Prescription` Model & Controller (`backend/models/prescription.js`, `backend/controllers/prescriptionController.js`)
- `Note`, `Feedback`, `AIAuditLog`, `ChatConversation` Models
- Scheduling & Availability Controllers (`backend/controllers/schedulingController.js`)
- All Receptionist, Doctor, Therapist, and Patient Dashboards

---

## A. Comprehensive Registry of Untouched Existing Files

To guarantee **ZERO** risk to production features, the following existing files are designated as **STRICTLY READ-ONLY** and will **NOT** be modified, moved, renamed, or refactored:

1. `backend/services/ai/chatbotService.js`
2. `backend/services/ai/providers/AyurSutraKnowledgeProvider.js`
3. `backend/services/ai/engines/PersonalizedDietEngine.js`
4. `backend/services/ai/engines/HerbSafetyEngine.js`
5. `backend/controllers/appointmentsController.js`
6. `backend/controllers/authController.js`
7. `backend/controllers/prescriptionController.js`
8. `backend/controllers/schedulingController.js`
9. `backend/controllers/userController.js`
10. `backend/models/appointment.js`
11. `backend/models/user.js`
12. `backend/models/prescription.js`
13. `backend/models/note.js`
14. `backend/models/feedback.js`
15. `mobile/components/AIChatbotModal.tsx`
16. `mobile/components/BookAppointmentModal.tsx`
17. `mobile/screens/ReceptionistDashboardScreen.tsx`
18. `mobile/screens/DoctorDashboardScreen.tsx`
19. `mobile/screens/PatientDashboardScreen.tsx`
20. `mobile/screens/TherapistDashboardScreen.tsx`

---

## B. New Isolated Files & Structure Required for Phase 2

All new chatbot code will be placed exclusively in brand-new, isolated directories:

### 1. Isolated Engine (`backend/services/ai/ayursutra-chatbot/`)
- `AyurSutraChatbotEngine.js` (Master orchestrator)
- `SafetyEngine.js` (Pipeline safety orchestrator)
- `EmergencyEngine.js` (Emergency category detector & escalation)
- `DomainClassifier.js` (Ayurvedic domain restriction filter)
- `IntentClassifier.js` (27-taxonomy intent classifier)
- `KnowledgeSearch.js` (Deterministic weighted search engine)
- `PatientContextAdapter.js` (Read-only patient profile filter)
- `DietEngine.js` (Isolated diet guidance & allergy safety engine)
- `HerbSafetyEngine.js` (Isolated herb safety engine)
- `TherapyGuidanceEngine.js` (Panchakarma preparation & aftercare engine)
- `ResponseComposer.js` (Structured JSON response generator)
- `CitationEngine.js` (Source verification & citation manager)
- `index.js` (Module entry point)

### 2. Isolated Offline Knowledge Base (`backend/data/ayurveda/isolated-chatbot/`)
- `basics/index.js` (Ayurveda fundamentals, Doshas, Agni, Ama, Dhatus)
- `diet/index.js` (Ayurvedic diets, Pathya & Apathya principles)
- `herbs/index.js` (Herb safety, traditional uses, Rasa, Virya, Vipaka)
- `therapies/index.js` (Abhyanga, Shirodhara, Swedana, Pizhichil, etc.)
- `panchakarma/index.js` (Basti, Vamana, Virechana, Nasya, Raktamokshana)
- `lifestyle/index.js` (Dinacharya, Ritucharya, sleep, hydration, exercise)
- `safety/index.js` (Emergency phrases, prohibited action patterns)
- `faq/index.js` (Common patient questions)
- `classical/sushruta.js` (NIIMH e-Sushruta indexed dataset)
- `classical/ashtangaHridaya.js` (Vedotpatti digital text indexed dataset)
- `index.js` (Master knowledge base search interface)

### 3. Isolated Route & Database Model
- Route: `backend/routes/ayursutraChatbotRoutes.js` (Mounts `POST /api/ayursutra-chatbot/message`)
- Model: `backend/models/ayursutraChatbotConversation.js` (Isolated chat history storage)

### 4. Isolated Mobile UI Component (`mobile/components/AyurSutraIsolatedChatbot/`)
- `AyurSutraChatbotModal.tsx` (Isolated modal interface)
- `ChatMessage.tsx` (Message bubble component)
- `ClassicalReferenceCard.tsx` (Classical source citation card)
- `SafetyBanner.tsx` (Emergency & safety banner)
- `SuggestedQuestionChips.tsx` (Quick question chips)

### 5. Automated Test Suite (50+ Tests)
- `backend/tests/ayursutra-isolated-chatbot.test.js`

---

## C. Optional Integration Points & Approval Policy

If mounting the new isolated API route in `server.js` or adding an entry point in `mobile/app/patient/index.tsx` requires touching an existing file:
1. **File:** `backend/server.js`
2. **Why:** To mount the new endpoint `POST /api/ayursutra-chatbot/message`.
3. **Proposed Line:** `app.use('/api/ayursutra-chatbot', require('./routes/ayursutraChatbotRoutes'));`
4. **Risk:** Extremely low; completely separate URL path namespace.
5. **Approval Policy:** No edit will be performed on `server.js` or any navigation file without explicit approval from the user.

---

## D. Database Access Requirements
- **Read-Only Access:** The chatbot will read patient data (`age`, `gender`, `condition`, `allergies`, `activeTherapyPlan`, `appointments`, `prescriptions`) strictly via the isolated `PatientContextAdapter.js`.
- **Database Immutability:** The chatbot has ZERO write access to clinical collections (`User`, `Appointment`, `Prescription`, `TreatmentPlan`, `Note`).

---

## E. Security & Privacy Requirements
1. **JWT Authentication & Ownership:** `userId` is strictly extracted from the authenticated JWT token. Patient A can NEVER query or view Patient B's data or chat history.
2. **Prompt Injection Defense:** User input strings are processed purely as data strings (`DATA`), preventing system prompt overrides or safety bypass attempts.
3. **PII Minimization:** Excludes passwords, emails, phone numbers, home addresses, emergency contacts, and internal database keys.

---

## F. Classical Knowledge & Citation Rules
- **Sources:** NIIMH e-Sushruta (`https://niimh.nic.in/ebooks/esushruta/`) & Vedotpatti Ashtanga Hridaya (`https://vedotpatti.in/samhita/Vag/ehrudayam/?mod=read`).
- **No Hallucination Policy:** Displays `📜 Classical Ayurvedic Reference` badge **ONLY** when `verified === true` local record exists. Unverified references return: `"Classical source reference could not be verified in the currently indexed AyurSutra knowledge base."`

---

## G. Automated Test Suite Strategy (50 Tests)
Location: `backend/tests/ayursutra-isolated-chatbot.test.js`

1-25: 27 Intent Taxonomy coverage (Basics, Dosha, Agni, Diet, Herbs, Panchakarma, Dinacharya, Ritucharya, Sleep, Stress, Hydration, Exercise, Therapy Prep/Aftercare, Patient Appointments, Prescriptions, Classical References, etc.).  
26-35: Safety tests (Emergency detection, prohibited action refusal, out-of-scope filter, allergy exclusions, missing allergy warnings).  
36-45: Isolation & Security tests (Patient A vs Patient B isolation, unauthorized access prevention, prompt injection defense, database immutability).  
46-50: Network isolation (Zero external LLM HTTP calls) and source traceability checks.

---

## H. Maintenance of Complete Isolation
- 100% Offline execution using local JavaScript rule engines and indexed JSON/JS knowledge bases.
- Zero external API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY` unpopulated).
- Completely segregated directory trees for backend logic, datasets, and mobile components.

---

**PHASE 1 COMPLETE. STOPPED AS REQUIRED. AWAITING YOUR EXPLICIT APPROVAL BEFORE PROCEEDING TO PHASE 2 IMPLEMENTATION.**
