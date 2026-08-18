# 07 — Risk Analysis & Fail-Safe Rollback Strategy (Revised)

## 1. Clinical & Patient Safety Risk Matrix

| Identified Risk | Severity | Revised Mitigation Strategy |
| :--- | :--- | :--- |
| **Diagnostic Hallucination:** AI predicts inaccurate or alarmist medical conditions. | **High** | Clinical Decision Support ONLY. Results accessible exclusively to licensed Doctors. Prominent disclaimers attached. **Strict non-fabrication rule:** If AI is unavailable, return explicit `service_unavailable` status; never generate fake diagnoses using simplistic rules. |
| **Unauthorized Treatment Change:** AI automatically alters prescriptions or appointments. | **Critical** | AI recommendations MUST NOT modify prescriptions or appointments automatically. Doctors retain 100% manual confirmation authority. |
| **Inappropriate Patient Advice:** Chatbot provides dangerous medical diagnosis to patients. | **High** | Chatbot system prompt strictly prohibits diagnosing acute conditions or altering prescriptions. Advises consulting doctor for medical decisions. |

---

## 2. Technical & Fail-Safe Rollback Strategy

### A. Automatic Fail-Safe Execution Flow
```
User Requests AI Action (e.g. Disease Prediction / Treatment Recommendation)
                    │
                    ▼
          Is Backend Reachable?
          ├── NO  ──► Mobile app renders OfflineBanner / Local Error View
          └── YES ──► Express Backend Invokes AI Endpoint
                           │
                           ▼
                 Is External AI API Available?
                 ├── YES ──► Process prompt with minimized PII-stripped payload & return result
                 └── NO  ──► Return explicit JSON payload:
                             { "success": false, "status": "service_unavailable", "message": "AI Service Offline" }
```

### B. Instant Component Isolation / Rollback
1. **Zero Impact Guarantee:** If an AI component (e.g., `AIChatbotModal`, `ClinicalSupportModal`, `SmartSchedulingModal`) experiences an unhandled runtime error, React Error Boundaries catch the error locally. The rest of the screen (appointments list, patient bio, consultation notes) remains 100% functional.
2. **Backend Route Decoupling:** All new AI/Analytics endpoints reside in isolated namespace files (`aiRoutes.js`, `analyticsRoutes.js`, `schedulingRoutes.js`). Commenting out any namespace in `backend/routes/index.js` cleanly disables that feature without affecting authentication, booking, or prescriptions.

---

## 3. Backward Compatibility Regression Test Plan

Prior to completing each phase, the following baseline test plan must pass with zero regression:
1. **Auth & User Roles:** Login, token persistence, and role switching (Admin, Doctor, Therapist, Receptionist, Patient).
2. **Appointments:** Master schedule view, booking creation, status updater, payment status settlement.
3. **Prescriptions:** Protocol creation, duration setting, progress increment logger.
4. **Notes & Reports:** Clinical progress note creation, patient health report compilation (`GET /api/reports/my-report`).
5. **Mobile Verification:** Clean TypeScript compilation (`npx tsc --noEmit`) and Expo Go loading on Android & iOS.
