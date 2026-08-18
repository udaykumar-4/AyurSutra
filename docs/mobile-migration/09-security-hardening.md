# AyurSutra Phase 9: Security Audit & Hardening Specification

## Executive Summary

AyurSutra handles confidential medical and Panchakarma healthcare data. This document details the complete security audit conducted across both the **Node.js/Express REST API backend** and the **React Native / Expo mobile application**, along with the server-side authorization hardening implementation to enforce **Least-Privilege Healthcare Data Access**.

---

## 🔍 Audit Findings & Vulnerability Matrix

| Endpoint | Vulnerability Type | Description & Impact | Fix & Server-Side Enforcement |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/register` | **Unrestricted Registration** | Unauthenticated callers could specify `role: "admin"` or `role: "doctor"` and create privileged accounts. | Restrict public self-registration to `role: "patient"`. Staff creation (`doctor`, `therapist`, `receptionist`, `admin`) requires `protect` and `admin` middleware. |
| `GET /api/users` | **Data Leakage & IDOR** | Endpoint was guarded by `protect` only. Patients could query all user records, emails, and phone numbers. | Restrict `GET /api/users` to `staff` middleware (`admin`, `doctor`, `therapist`, `receptionist`). Block patient queries. |
| `GET /api/appointments` | **BOLA / IDOR** | Unfiltered parameter query (`req.query.patientId`) allowed patients to read appointments of other patients. | Enforce server-side role filters in controller: Patients get ONLY their appointments (`patientId = req.user._id`). Doctors/Therapists get assigned appointments. |
| `GET /api/appointments/:id` | **BOLA** | Missing object ownership check. Any logged-in user could view any appointment by ID. | Verify `appointment.patientId == req.user._id` OR `appointment.doctorId == req.user._id` OR `appointment.therapistId == req.user._id` OR `staff`. |
| `PUT /api/appointments/:id/status` | **Broken Privilege Controls** | Any user could update status of any appointment. | Restrict status updates to assigned Doctor, assigned Therapist, Receptionist, or Admin. |
| `DELETE /api/appointments/:id` | **Unauthorized Deletion** | Patients could delete any appointment ID. | Allow deletion ONLY if caller is the owning Patient (for scheduled appointments), Receptionist, or Admin. |
| `PUT /api/appointments/:id/pay` | **Unauthorized Billing Action** | Any user could mark appointments as paid. | Restrict payment settlement to `receptionist`, `admin`, or verified payment gateway callback. |
| `GET /api/prescriptions/patient/:patientId` | **Medical BOLA** | Any user could read prescription details of arbitrary patient IDs. | Enforce: Patient can ONLY read their own `req.user._id`. Doctor/Therapist can read assigned patient prescriptions. Admin can read all. |
| `PUT /api/prescriptions/:id/progress` | **Unauthorized Session Log** | Any doctor/therapist could update progress on unassigned prescriptions. | Verify `prescription.therapistId == req.user._id` OR `prescription.doctorId == req.user._id` OR `admin`. |
| `GET /api/notes/patient/:patientId` | **Clinical Data Leakage** | Anyone logged in (including Receptionists and Patients) could read progress notes of any patient ID. | Enforce: Patient can read own notes. Doctor/Therapist can read notes for patients under their care. Receptionists are restricted. |
| `POST /api/auth/login` & `PUT /api/users/profile` | **Sensitive Data Leakage** | `toObject()` returned hashed password fields in JSON responses. | Explicitly strip `password` from all API response objects. |

---

## 🔐 Server-Side Role & Access Control Matrix

```
┌─────────────────┬──────────┬────────┬───────────┬──────────────┬────────┐
│ Resource / Action│ Patient  │ Doctor │ Therapist │ Receptionist │ Admin  │
├─────────────────┼──────────┼────────┼───────────┼──────────────┼────────┤
│ Own Appointments│ Read/Book│ Read/Edit│ Read/Edit │ Full Control │ Full   │
│ Other Appts     │ Blocked  │ Assigned│ Assigned  │ Full Control │ Full   │
│ Prescriptions   │ Own Read │ Create/Edit│ Progress │ Blocked      │ Full   │
│ Clinical Notes  │ Own Read │ Create/Read│ Create/Read│ Blocked   │ Full   │
│ User Directory  │ Blocked  │ Staff  │ Staff     │ Staff        │ Full   │
│ Register Staff  │ Blocked  │ Blocked│ Blocked   │ Blocked      │ Full   │
└─────────────────┴──────────┴────────┴───────────┴──────────────┴────────┘
```

---

## 🛡️ Mobile Application Security Verification

1. **Credentials & Secrets Inspection:**
   - Verified **zero MongoDB URIs**, **zero DB passwords**, and **zero JWT secrets** exist in `/mobile` codebase.
   - All authentication JWT tokens are stored in hardware-backed `expo-secure-store`.
2. **Transport Security:**
   - Production API base URL configured for HTTPS.
3. **UI vs Backend Security Alignment:**
   - UI hide/show features are mirrored by strict backend authorization middleware & controller object checks.

---

## 🧪 Verification & Manual Testing Suite

To verify security hardening:
1. **Test Unauthorized Registration:** Issue `POST /api/auth/register` with `role: "admin"` as unauthenticated user -> Expect `403 Forbidden` / `400 Bad Request`.
2. **Test Patient BOLA:** Login as Patient A and issue `GET /api/appointments?patientId=<PATIENT_B_ID>` -> Expect ONLY Patient A appointments returned.
3. **Test Note Exposure:** Login as Receptionist and issue `GET /api/notes/patient/<PATIENT_ID>` -> Expect `403 Forbidden`.
4. **Test Prescription Tampering:** Login as Doctor A and attempt `PUT /api/prescriptions/<DOCTOR_B_RX_ID>/progress` -> Expect `403 Forbidden`.
