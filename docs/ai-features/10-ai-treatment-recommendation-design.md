# 10 — AI Treatment Recommendation Architecture & Safety Design Specification

## 1. Existing Clinical Data Sources & Schema Inventory

- [`User.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/user.js): `age`, `gender`, `condition` (recorded diagnosis string), `allergies`, `assignedDoctor`.
- [`Prescription.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/prescription.js): `treatment` (Consultation, Abhyanga, Shirodhara, Swedana, Pizhichil), `duration`, `progressCompleted`, `plan`, `notes`.
- [`Appointment.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/appointment.js): Recent consultation history & treatment modalities.

---

## 2. Server-Side Role Authorization Matrix

```
┌──────────────┬─────────────────────────────────────────────────────────────────┐
│ User Role    │ Treatment Recommendation Authorization                          │
├──────────────┼─────────────────────────────────────────────────────────────────┤
│ Doctor       │ ✅ Allowed for assigned/authorized patients only                 │
│ Therapist    │ ❌ Restricted (Cannot generate doctor-level prescriptions)     │
│ Patient      │ ❌ 403 Forbidden (Recovers therapy info via Phase 3 Chatbot)     │
│ Receptionist │ ❌ 403 Forbidden                                                │
│ Admin        │ ❌ 403 Forbidden (No individual clinical recommendations)       │
└──────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Payload Minimization & PII Stripping

Before sending data to external AI models (Google Gemini API):
1. **PII Removal:** `full_name`, `email`, `phone`, `address`, and `emergencyContact` are explicitly stripped.
2. **Task-Specific Clinical Context:** Includes ONLY `age`, `gender`, `condition`, `allergies` (if documented), `activeTreatment`, `progressCompleted`, and recent vitals.
3. **No Unknown Statements:** If allergy records are missing, the payload explicitly marks `allergiesRecorded: false`. The system does **NOT** claim "No allergies".

---

## 4. Structured Output Schema

The recommendation engine returns a strictly validated JSON structure:

```json
{
  "recommendationStatus": "success",
  "clinicalContext": {
    "patientAge": 34,
    "gender": "Female",
    "presentingCondition": "Joint Pain / Vata Imbalance",
    "allergiesRecorded": false
  },
  "suggestedOptions": [
    {
      "treatmentName": "Abhyanga & Swedana",
      "suggestedSessions": 7,
      "primaryObjective": "Pacify Vata dosha and relieve stiffness",
      "rationale": "Indicated for neuromuscular stiffness and joint lubrication",
      "considerations": "Ensure oil temperature is mild"
    }
  ],
  "contraindicationWarnings": [
    "Allergy history is unconfirmed in database; clinician verification required."
  ],
  "uncertainty": "Low-to-moderate uncertainty based on available vitals",
  "clinicianReviewRequired": true,
  "disclaimer": "⚠️ AI-generated clinical decision support. Requires clinician verification."
}
```

---

## 5. Non-Autonomous & Non-Prescribing Safeguards

- **Zero Automatic Prescribing:** Recommendations are stored in a dedicated `ai_recommendations` collection. They are **NEVER** automatically copied into the `Prescription` model.
- **Manual Confirmation:** A doctor reviewing a recommendation must manually click into the existing prescription creation flow to confirm and issue a prescription.
- **Non-Fabricating Fallback:** If the AI service is offline, the backend returns an explicit `service_unavailable` state (`{ success: false, status: 'service_unavailable' }`). No pseudo-recommendations are generated.

---

## 6. API Endpoints & Database Model

- **Model:** [`backend/models/aiRecommendation.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/aiRecommendation.js)
- **Endpoints:**
  - `POST /api/ai/treatment-recommendations/generate`
  - `GET /api/ai/treatment-recommendations/:patientId`
- **Mobile Component:** [`mobile/components/ClinicalSupportModal.tsx`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/components/ClinicalSupportModal.tsx)
