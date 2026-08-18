# 11 — AI Disease Prediction Architecture & Safety Design Specification

## 1. Existing Clinical Data Sources & Schema Inventory

- [`User.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/user.js): `age`, `gender`, `condition` (recorded primary diagnosis string), `allergies`, `assignedDoctor`.
- [`Note.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/note.js): Clinical observations logged by attending clinicians.
- [`Prescription.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/prescription.js): Previous therapy histories.

---

## 2. Server-Side Role Authorization Matrix

```
┌──────────────┬─────────────────────────────────────────────────────────────────┐
│ User Role    │ AI Disease Prediction Authorization                            │
├──────────────┼─────────────────────────────────────────────────────────────────┤
│ Doctor       │ ✅ Allowed for assigned/authorized patients only                 │
│ Therapist    │ ❌ Restricted (Cannot perform doctor-level disease predictions) │
│ Patient      │ ❌ 403 Forbidden (Clinician decision support only)               │
│ Receptionist │ ❌ 403 Forbidden                                                │
│ Admin        │ ❌ 403 Forbidden                                                │
└──────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Payload Minimization & PII Stripping

Before sending data to external AI models (Google Gemini API):
1. **PII Removal:** `full_name`, `email`, `phone`, `address`, `emergencyContact`, and internal ObjectIds are explicitly stripped.
2. **Clinical Context:** Includes ONLY `age`, `gender`, `presentingSymptoms`, `recordedCondition`, and recent clinical note excerpts.
3. **No Unconfirmed Claims:** If vitals or history are missing, the payload explicitly states `missingData: true` rather than inferring or fabricating values.

---

## 4. Structured Output Schema

The prediction engine returns a strictly validated JSON structure:

```json
{
  "predictionStatus": "success",
  "clinicalContext": {
    "patientAge": 34,
    "gender": "Female",
    "presentingSymptoms": "Joint pain, morning stiffness, dryness"
  },
  "possibleConditions": [
    {
      "conditionName": "Amavata (Rheumatoid Arthritis / Vata-Kapha Imbalance)",
      "probabilityCategory": "High",
      "supportingFactors": [
        "Symmetrical joint stiffness aggravated by cold weather",
        "Associated dryness and digestive sluggishness"
      ],
      "differentialConsiderations": "Rule out Sandhigata Vata (Osteoarthritis)"
    }
  ],
  "uncertainty": "Low-to-moderate clinical uncertainty based on automated text evaluation",
  "limitations": "Requires laboratory serology (ESR/RF) and physical joint palpation",
  "clinicianReviewRequired": true,
  "disclaimer": "⚠️ AI-generated clinical decision support. This is not a confirmed diagnosis and requires clinician verification."
}
```

---

## 5. Database Model & Endpoints

- **Model:** [`backend/models/aiPrediction.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/aiPrediction.js)
- **Endpoints:**
  - `POST /api/ai/predictions/generate`
  - `GET /api/ai/predictions/patient/:patientId`
- **Mobile Component:** [`mobile/components/DiseasePredictionModal.tsx`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/components/DiseasePredictionModal.tsx)
