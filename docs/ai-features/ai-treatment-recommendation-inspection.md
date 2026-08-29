# AyurSutra — Isolated Patient AI Treatment Recommendation Inspection Report

## 1. Existing Architecture Overview

The **AyurSutra** system is structured as a two-tier clinical architecture:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER                                          │
│  • Mobile App: React Native (Expo SDK 52, Expo Router v4, TypeScript)                   │
│  • Web App: Single-Page Application (HTML5, CSS3, Vanilla ES6 JavaScript, jsPDF)        │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ Authenticated REST API (JWT Bearer Token)
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  BACKEND REST API                                       │
│  • Runtime: Node.js + Express.js Framework                                              │
│  • Auth: JWT Token Authentication via protect middleware                                │
│  • AI & Analytics Subsystem: Server-Side Proxies & Deterministic Knowledge Engine       │
└───────────────────────────────────────────┬─────────────────────────────────────────────┘
                                            │ Mongoose ODM
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                  MONGODB DATABASE                                       │
│  • Collections: Users, Appointments, Prescriptions, Notes, Feedback, ChatConversations, │
│                 AIRecommendations, AIPredictions, AIAuditLogs                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Subsystems:
- **Authentication & RBAC**: Handled in `backend/middleware/authMiddleware.js`. Token verification decodes user ID and populates `req.user`. Roles enforced: `admin`, `doctor`, `therapist`, `receptionist`, `patient`.
- **Existing AI Services**:
  - `backend/services/ai/chatbotService.js`: Self-contained 24/7 AI Chatbot.
  - `backend/services/ai/diseasePredictionService.js`: Doctor-only differential diagnostic support.
  - `backend/services/ai/treatmentRecommendationService.js`: Doctor-only treatment decision support.
  - `backend/services/ai/providers/AyurSutraKnowledgeProvider.js`: 35KB+ classical knowledge base.
- **Mobile Navigation**: File-based routing with Expo Router (`mobile/app/patient/index.tsx`, `mobile/app/doctor/index.tsx`, etc.).

---

## 2. Existing Files Relevant to the Feature

### Backend Files:
- [`backend/server.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/server.js) — Main Express app entrypoint.
- [`backend/routes/index.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/routes/index.js) — Master router mounting `/api/*`.
- [`backend/routes/aiRoutes.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/routes/aiRoutes.js) — Existing AI route mounts.
- [`backend/middleware/authMiddleware.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/middleware/authMiddleware.js) — Authentication (`protect`) & role middleware.
- [`backend/models/user.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/user.js) — User schema (patient profile, allergies, condition).
- [`backend/data/ayurveda/therapies.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/data/ayurveda/therapies.js) — Curated Panchakarma therapy dataset (Abhyanga, Shirodhara, Swedana, Basti, Nasya, Virechana, Vamana).

### Mobile Files:
- [`mobile/app/patient/index.tsx`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/app/patient/index.tsx) — Patient Dashboard screen.
- [`mobile/app/patient/treatment.tsx`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/app/patient/treatment.tsx) — Patient Treatment Plan screen.
- [`mobile/app/patient/appointments.tsx`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/app/patient/appointments.tsx) — Patient Appointment screen.
- [`mobile/components/BookAppointmentModal.tsx`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/components/BookAppointmentModal.tsx) — Existing appointment booking modal.
- [`mobile/services/aiService.ts`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/services/aiService.ts) — Mobile AI API client wrapper.

---

## 3. Files That Must Remain Untouched

To guarantee absolute protection of the existing application, the following files will **NOT** be modified in any way:

- **Appointment & Scheduling**:
  - `backend/controllers/appointmentsController.js`
  - `backend/controllers/schedulingController.js`
  - `backend/routes/appointmentRoutes.js`
  - `backend/routes/schedulingRoutes.js`
  - `backend/models/appointment.js`
  - `backend/services/scheduling/smartSchedulingService.js`
- **Prescriptions & Clinical Notes**:
  - `backend/controllers/prescriptionController.js`
  - `backend/controllers/noteController.js`
  - `backend/routes/prescriptionRoutes.js`
  - `backend/routes/noteRoutes.js`
  - `backend/models/prescription.js`
  - `backend/models/note.js`
- **Authentication & User Management**:
  - `backend/controllers/authController.js`
  - `backend/controllers/userController.js`
  - `backend/routes/authRoutes.js`
  - `backend/routes/userRoutes.js`
  - `backend/models/user.js`
- **Doctor, Therapist, Receptionist, & Admin Workflows**:
  - `mobile/app/doctor/*`
  - `mobile/app/therapist/*`
  - `mobile/app/receptionist/*`
  - `mobile/app/admin/*`
  - `mobile/components/ClinicalSupportModal.tsx`
  - `mobile/components/DiseasePredictionModal.tsx`
  - `mobile/context/AuthContext.tsx`
  - `mobile/api/client.ts`

---

## 4. New Files Required

The new feature will be implemented as an **additive, isolated module**:

### Backend Subsystem:
1. `backend/models/patientTreatmentRecommendation.js` — Dedicated Mongoose schema for patient-generated recommendations.
2. `backend/services/ai/patient-treatment-recommendation/TreatmentRecommendationEngine.js` — Main recommendation processing pipeline.
3. `backend/services/ai/patient-treatment-recommendation/TreatmentSafetyEngine.js` — Emergency detection & prohibited request filter.
4. `backend/services/ai/patient-treatment-recommendation/SymptomClassifier.js` — Structured symptom taxonomy classifier.
5. `backend/services/ai/patient-treatment-recommendation/AyurvedaTherapyMatcher.js` — Rule-based Panchakarma therapy matcher using `data/ayurveda/therapies.js`.
6. `backend/services/ai/patient-treatment-recommendation/RecommendationComposer.js` — Formats structured output with disclaimers and safety warnings.
7. `backend/services/ai/patient-treatment-recommendation/PatientContextReader.js` — Reads minimal authorized context for the requesting patient.
8. `backend/services/ai/patient-treatment-recommendation/index.js` — Module entrypoint.
9. `backend/controllers/patientTreatmentRecommendationController.js` — Express controller enforcing strict patient ownership (`req.user._id === patientId`).
10. `backend/routes/patientTreatmentRecommendationRoutes.js` — Express router for `/api/ai/patient-treatment-recommendations`.
11. `backend/tests/patient-treatment-recommendation.test.js` — Automated test suite verifying isolated logic, emergency handling, and IDOR prevention.

### Mobile Subsystem:
1. `mobile/types/patientTreatmentRecommendation.ts` — TypeScript type definitions.
2. `mobile/services/patientTreatmentRecommendationService.ts` — Isolated API client service.
3. `mobile/components/PatientTreatmentRecommendationModal.tsx` — Isolated UI modal dialog for patients.

---

## 5. Existing Files That Might Require Integration

1. [`backend/routes/index.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/routes/index.js)
2. [`mobile/app/patient/index.tsx`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/app/patient/index.tsx)
3. [`mobile/app/patient/treatment.tsx`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/app/patient/treatment.tsx)

---

## 6. Why Each Integration Is Required

1. **`backend/routes/index.js`**:
   - **Why**: Mounts the new isolated router namespace:
     ```javascript
     const patientTreatmentRecommendationRoutes = require('./patientTreatmentRecommendationRoutes');
     router.use('/ai/patient-treatment-recommendations', patientTreatmentRecommendationRoutes);
     ```
   - **Impact**: Purely additive. Does not alter any existing route.
2. **`mobile/app/patient/index.tsx`**:
   - **Why**: Renders the new entry point button/card `"🌿 AI Treatment Recommendations"` on the Patient Dashboard to trigger `PatientTreatmentRecommendationModal`.
   - **Impact**: Purely additive UI element. Does not alter existing dashboard cards, appointments list, or state.
3. **`mobile/app/patient/treatment.tsx`**:
   - **Why**: Adds an entry point card on the Patient Treatment Plan screen so patients can discover recommendations while reviewing their protocol.
   - **Impact**: Purely additive UI element.

---

## 7. Database Requirements

- **Collection**: `patienttreatmentrecommendations` via [`backend/models/patientTreatmentRecommendation.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/patientTreatmentRecommendation.js).
- **Schema Fields**:
  - `patientId`: `Schema.Types.ObjectId` (ref: `User`, indexed, required)
  - `symptoms`: `String` (required)
  - `quickSelections`: `[String]`
  - `recommendations`: `[{ therapy, category, objective, traditionalRationale, duration, precautions, contraindications, confidence, educationalOnly, requiresClinicianReview }]`
  - `safetyWarnings`: `[String]`
  - `contraindications`: `[String]`
  - `classicalReferences`: `[{ source, title, text }]`
  - `educationalOnly`: `Boolean` (default: `true`)
  - `requiresClinicianReview`: `Boolean` (default: `true`)
  - `disclaimer`: `String`
  - Timestamps (`createdAt`, `updatedAt`)
- **Zero Modifications**: Existing `User`, `Appointment`, and `Prescription` models will remain completely unchanged.

---

## 8. API Requirements

Isolated REST Namespace: `/api/ai/patient-treatment-recommendations`

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/patient-treatment-recommendations` | `protect` (`role === 'patient'`) | Generate new educational treatment recommendation for authenticated patient. |
| `GET` | `/api/ai/patient-treatment-recommendations` | `protect` (`role === 'patient'`) | Fetch recommendation history for authenticated patient. |
| `GET` | `/api/ai/patient-treatment-recommendations/:id` | `protect` (`role === 'patient'`) | Fetch single recommendation record by ID with ownership verification. |

---

## 9. Security Requirements

1. **Authentication**: All endpoints require valid JWT via `protect` middleware.
2. **Role Authorization**: Restrict namespace strictly to `role === 'patient'`. Receptionists, Therapists, Doctors, or unauthenticated users receive `HTTP 403 Forbidden`.
3. **IDOR Ownership Guard**: The backend forces `patientId = req.user._id`. Any request containing a mismatched `patientId` returns `HTTP 403 Forbidden`.
4. **Server-Side API Key Isolation**: Zero external API keys or secrets exposed to mobile or web clients.

---

## 10. Patient IDOR Risks

- **Risk**: Patient A modifies request parameters to view or generate recommendations for Patient B.
- **Mitigation**:
  - `POST` endpoint ignores any client-supplied `patientId` and strictly uses `req.user._id`.
  - `GET /:id` performs explicit database query `{ _id: req.params.id, patientId: req.user._id }`. If no record is found, returns `HTTP 403 Forbidden`.

---

## 11. Appointment-Booking Integration Risks

- **Risk**: Automatically creating appointments or altering booking components risks breaking clinic scheduling.
- **Mitigation**:
  - The recommendation module NEVER creates an appointment or alters existing bookings.
  - The `[Book Consultation]` action on recommendation cards simply invokes the EXISTING navigation (`router.push('/patient/appointments')`) without touching any booking API, schema, or component.

---

## 12. AI Safety Risks

- **Emergency Symptoms**: Priority 1 check in `TreatmentSafetyEngine.js`. If symptoms contain emergency indicators (chest pain, breathing difficulty, stroke symptoms, loss of consciousness, severe bleeding, seizures), generation is HALTED immediately, returning a red Emergency Notice.
- **Prohibited Requests**: Refuse requests asking for diagnosis ("Diagnose me", "What disease do I have") or prescription alterations ("Stop my medicine", "Change prescription").
- **Zero Fabrication**: Sanskrit verses, chapter numbers, or classical references are NEVER generated unless explicitly present in `data/ayurveda/therapies.js`.
- **Wording Enforcement**: Output uses strictly educational phrasing: *"Based on the symptoms you entered, the following Ayurvedic therapies may be relevant for educational consideration."*

---

## 13. Exact Integration Strategy

```
Phase 0: Project Inspection & Inspection Report Creation (COMPLETED)
   │
   ▼
Phase 1: Backend Isolated Safety & Engine Subsystem
   ├── Create backend/services/ai/patient-treatment-recommendation/ (6 helper files)
   └── Create backend/models/patientTreatmentRecommendation.js
   │
   ▼
Phase 2: Backend Isolated API Namespace
   ├── Create backend/controllers/patientTreatmentRecommendationController.js
   ├── Create backend/routes/patientTreatmentRecommendationRoutes.js
   └── Mount in backend/routes/index.js
   │
   ▼
Phase 3: Mobile UI Component & Service
   ├── Create mobile/types/patientTreatmentRecommendation.ts
   ├── Create mobile/services/patientTreatmentRecommendationService.ts
   └── Create mobile/components/PatientTreatmentRecommendationModal.tsx
   │
   ▼
Phase 4: Additive Patient Dashboard Entry Points
   ├── Add "🌿 AI Treatment Recommendations" button/card in mobile/app/patient/index.tsx
   └── Add "🌿 AI Treatment Recommendations" button/card in mobile/app/patient/treatment.tsx
   │
   ▼
Phase 5: Booking Navigation Adapter
   └── Connect [Book Consultation] button to router.push('/patient/appointments')
   │
   ▼
Phase 6: Automated Testing & Verification
   ├── Run backend/tests/patient-treatment-recommendation.test.js
   └── Verify mobile type safety (cd mobile && npx tsc --noEmit)
```

---

## Conclusion & Stop Condition

Phase 0 inspection is complete. No application code files were modified during this phase.

**AWAITING APPROVAL TO PROCEED TO PHASE 1.**
