# 04 — AyurSutra API Extension & Exact Authorization Rules (Revised with Patient Scoping)

## 1. Role Authorization Matrix for New Endpoints

```
┌──────────────────────────────────────────────┬──────────┬────────┬───────────┬──────────────┬────────┐
│ Endpoint Namespace / Action                  │ Patient  │ Doctor │ Therapist │ Receptionist │ Admin  │
├──────────────────────────────────────────────┼──────────┼────────┼───────────┼──────────────┼────────┤
│ GET /api/analytics/outcomes (Clinic-Wide)   │ ❌ 403   │ ❌ 403  │ ❌ 403    │ ❌ 403       │ ✅ 200 │
│ GET /api/analytics/outcomes/doctor          │ ❌ 403   │ ✅ 200 │ ❌ 403    │ ❌ 403       │ ✅ 200 │
│ GET /api/analytics/outcomes/therapist       │ ❌ 403   │ ❌ 403  │ ✅ 200    │ ❌ 403       │ ✅ 200 │
│ GET /api/analytics/outcomes/patient         │ ✅ 200*  │ ✅ 200*│ ✅ 200*   │ ❌ 403       │ 🔒 Restricted │
│ POST /api/scheduling/recommendations        │ ❌ 403   │ ✅ 200 │ ✅ 200    │ ✅ 200       │ ✅ 200 │
│ POST /api/scheduling/check-conflicts         │ ❌ 403   │ ✅ 200 │ ✅ 200    │ ✅ 200       │ ✅ 200 │
│ POST /api/ai/chat/message                    │ ✅ 200   │ ✅ 200 │ ✅ 200    │ ✅ 200       │ ✅ 200 │
│ GET /api/ai/chat/history                     │ ✅ 200   │ ✅ 200 │ ✅ 200    │ ✅ 200       │ ✅ 200 │
│ DELETE /api/ai/chat/history/:id              │ ✅ 200   │ ✅ 200 │ ✅ 200    │ ✅ 200       │ ✅ 200 │
│ POST /api/ai/treatment-recommendations/gen   │ ❌ 403   │ ✅ 200 │ ❌ 403    │ ❌ 403       │ ❌ 403 │
│ POST /api/ai/predictions/generate            │ ❌ 403   │ ✅ 200 │ ❌ 403    │ ❌ 403       │ ❌ 403 │
│ GET /api/ai/predictions/patient/:patientId   │ ❌ 403   │ ✅ 200 │ ❌ 403    │ ❌ 403       │ ❌ 403 │
└──────────────────────────────────────────────┴──────────┴────────┴───────────┴──────────────┴────────┘
```
*\*Note: Enforced by strict server-side authorization checks detailed below.*

---

## 2. Server-Side Authorization Enforcement for `GET /api/analytics/outcomes/patient`

To prevent unauthorized patient analytics access, `GET /api/analytics/outcomes/patient` is protected by strict server-side scoping rules:

### A. PATIENT Role
- **Rule:** The backend ignores any `patientId` query parameter provided by the client and **forces** `targetPatientId = req.user._id`.
- **Enforcement:** A logged-in patient can access **ONLY** their own analytics. Attempting to query another patient's data is impossible because `req.user._id` overrides all request parameters.

### B. DOCTOR Role
- **Rule:** The backend verifies whether the target patient is authorized/assigned to the requesting doctor (i.e. `patient.assignedDoctor == req.user._id` OR the doctor is referenced on the patient's prescriptions/appointments).
- **Enforcement:** If a doctor passes an arbitrary `patientId` that is not assigned to them, the server rejects the request with `403 Forbidden ("Not authorized to access analytics for this patient")`.

### C. THERAPIST Role
- **Rule:** The backend verifies whether the target patient is actively assigned to the requesting therapist on a prescription or appointment (`prescription.therapistId == req.user._id` or `appointment.therapistId == req.user._id`).
- **Enforcement:** If the therapist is not assigned to the patient, the server rejects the request with `403 Forbidden`.

### D. ADMIN Role
- **Rule:** Admins access aggregated clinic-level analytics via `GET /api/analytics/outcomes`. Individual patient analytics via `/patient` are restricted unless a specific administrative patient ID is queried, which is logged to audit history.
