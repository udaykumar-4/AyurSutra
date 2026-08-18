# 05 — Security, Privacy & Server Authorization (Revised with Patient Scoping)

## 1. Patient Analytics Authorization Specification

`GET /api/analytics/outcomes/patient` enforces **strict server-side data isolation**:

1. **Patient Self-Scoping:** `targetPatientId = req.user._id` (client-supplied ID overrides are ignored).
2. **Doctor Scoping:** Verified against `assignedDoctor` or active appointment/prescription relationship. Returns `403 Forbidden` if unassigned.
3. **Therapist Scoping:** Verified against active therapy assignment (`therapistId` on prescriptions/appointments). Returns `403 Forbidden` if unassigned.
4. **Admin Scoping:** Individual patient analytics are restricted; admins use `GET /api/analytics/outcomes` for clinic-level aggregations.

---

## 2. Server-Side Enforcement (UI Independent)

- UI button hiding in the mobile app is **never** relied upon as security.
- The Express backend enforces access checks inside every route handler:
  - Patients attempting to call `POST /api/ai/predictions/generate` receive `403 Forbidden`.
  - Receptionists attempting to generate clinical recommendations receive `403 Forbidden`.
  - Unassigned doctors/therapists querying patient analytics receive `403 Forbidden`.

---

## 3. Data Payload Minimization & Audit Trail

- Sensitive AI and Analytics queries are logged to `AIAuditLog` in MongoDB (`userId`, `role`, `action`, `targetPatientId`, `timestamp`, `ip`).
- Zero API keys exist inside mobile app bundles.
