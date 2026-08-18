# AyurSutra Security Audit & Vulnerability Assessment

## Overview
This security audit details critical security vulnerabilities, missing access controls, and architectural weaknesses discovered in the AyurSutra codebase during static analysis.

---

## 1. High-Severity Security Vulnerabilities

### VULN-01: Public Administrative Account Creation (Role Escalation)
- **Severity:** 🔴 HIGH (CVSS 9.8)
- **Location:** `backend/controllers/authController.js` (`registerUser`, lines 14–30)
- **Vulnerability Description:** The registration controller accepts the `role` parameter directly from `req.body` without restricting unauthenticated callers.
  ```javascript
  const { full_name, email, password, role, designation } = req.body;
  const user = await User.create({ full_name, email, password, role, designation });
  ```
- **Exploit Scenario:** Any unauthenticated attacker can send a `POST /api/auth/register` payload containing `{"role": "admin"}` and instantly obtain full administrative access to the clinic's database.
- **Remediation:** Enforce `role: 'patient'` for public registration. Restrict creation of `doctor`, `therapist`, `receptionist`, and `admin` roles to authenticated `admin` users.

---

### VULN-02: Broken Object Level Authorization / IDOR in Appointments
- **Severity:** 🔴 HIGH (CVSS 8.5)
- **Location:** `backend/routes/appointmentRoutes.js` (lines 21–30) & `backend/controllers/appointmentsController.js`
- **Vulnerability Description:** Endpoints for modifying, paying, or deleting appointments are protected only by the generic `protect` middleware:
  ```javascript
  router.route('/:id').delete(protect, deleteAppointment);
  router.route('/:id/status').put(protect, updateAppointmentStatus);
  router.route('/:id/pay').put(protect, markAppointmentAsPaid);
  ```
  Neither the route definitions nor the controllers check if the logged-in user (`req.user`) is an admin, receptionist, or the owner of the appointment.
- **Exploit Scenario:** A malicious patient can issue `DELETE /api/appointments/<any_id>` or `PUT /api/appointments/<any_id>/pay` to cancel another patient's appointment or fraudulently mark their own invoice as paid.
- **Remediation:** Add authorization checks verifying `req.user.role === 'admin' || req.user.role === 'receptionist'` or `appointment.patientId.toString() === req.user._id.toString()`.

---

### VULN-03: Global Medical & Personal Data Exposure in Appointments Listing
- **Severity:** 🔴 HIGH (CVSS 7.5)
- **Location:** `backend/controllers/appointmentsController.js` (`getAppointments`, lines 79–103)
- **Vulnerability Description:** `getAppointments` filters appointments ONLY when `patientId`, `doctorId`, or `therapistId` are passed in query params. If an authenticated user calls `GET /api/appointments` without query parameters, the controller executes `Appointment.find({})` and returns all clinic appointments.
- **Exploit Scenario:** Any logged-in patient can fetch the complete list of clinic appointments, exposing patient names, treatment types, and staff assignments.
- **Remediation:** Scope queries inside `getAppointments` based on `req.user.role`. If `req.user.role === 'patient'`, force `filter.patientId = req.user._id`.

---

### VULN-04: Unauthorized Access to Patient Records & Notes
- **Severity:** 🔴 HIGH (CVSS 7.5)
- **Location:** `backend/routes/prescriptionRoutes.js` (line 21) & `backend/routes/noteRoutes.js` (line 8)
- **Vulnerability Description:** 
  `GET /api/prescriptions/patient/:patientId` and `GET /api/notes/patient/:patientId` use only `protect` middleware. They do not verify if `req.user._id` matches `:patientId` or if `req.user` is a staff member.
- **Exploit Scenario:** A patient can query another patient's complete prescription history and clinical notes by substituting another user's `ObjectId` into the URL path.
- **Remediation:** Verify `req.user._id.toString() === req.params.patientId` or `['admin', 'doctor', 'therapist'].includes(req.user.role)`.

---

## 2. Medium-Severity Security Vulnerabilities

### VULN-05: Hardcoded MongoDB Credentials in Git Workspace
- **Severity:** 🟡 MEDIUM (CVSS 6.5)
- **Location:** `backend/.env` (line 1)
- **Vulnerability Description:** Production database connection credentials (`mongodb+srv://udaykumarkullolli_db_user:Udayk_2005@cluster0.h9ydft8.mongodb.net/...`) are stored in plain text inside `.env` within the project root.
- **Remediation:** Rotate database credentials immediately. Add `.env` to `.gitignore` and provide `.env.example` template.

### VULN-06: JWT Token Storage in SessionStorage (XSS Vulnerability)
- **Severity:** 🟡 MEDIUM (CVSS 6.1)
- **Location:** `frontend/js/script.js` (lines 105, 185)
- **Vulnerability Description:** The front-end stores JWT tokens in browser `sessionStorage`. Any Cross-Site Scripting (XSS) payload can steal the raw JWT token.
- **Remediation:** For mobile app migration, use OS Secure Storage (Expo SecureStore / React Native Keychain). For web, transition to HttpOnly SameSite cookies.

### VULN-07: Unauthenticated Legacy API Calls (`admin.js` & `main.js`)
- **Severity:** 🟡 MEDIUM (CVSS 5.3)
- **Location:** `frontend/js/admin.js` & `frontend/js/main.js`
- **Vulnerability Description:** Legacy frontend scripts execute unauthenticated `fetch()` calls to `http://localhost:5000/api/appointments` without attaching JWT headers.

---

## 3. Security Audit Matrix & Remediation Summary

| Ref ID | Category | Affected Component | Vulnerability | Fixed in Current Phase? | Planned Migration Fix |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VULN-01** | Auth | `authController.js` | Unrestricted role selection in public registration | ❌ (Analysis Only) | Restrict registration to `'patient'` role |
| **VULN-02** | BOLA | `appointmentRoutes.js` | Missing ownership check on delete/status/pay | ❌ (Analysis Only) | Add role & ownership verification middleware |
| **VULN-03** | Data Exposure | `appointmentsController.js` | Global appointment leak without query params | ❌ (Analysis Only) | Enforce auto-scoping by `req.user` |
| **VULN-04** | Data Exposure | `prescriptionRoutes.js` | Unauthorized access to patient prescriptions | ❌ (Analysis Only) | Restrict to patient owner or assigned medical staff |
| **VULN-05** | Config | `.env` | Plain-text database credentials in repository | ❌ (Analysis Only) | Environment variable rotation |
| **VULN-06** | Session | `script.js` | Insecure token storage in `sessionStorage` | ❌ (Analysis Only) | Implement OS SecureStore in mobile app |
