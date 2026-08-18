# AyurSutra Role-Permission & Access Matrix

## Overview
AyurSutra defines 5 system roles: **Admin**, **Doctor**, **Therapist**, **Receptionist**, and **Patient**. 

This document maps out the target functional permission matrix, compares it against actual backend implementations in middleware/routes, and highlights access control deficiencies.

---

## 1. Core Role Definitions & Responsibilities

1. **ADMIN:** System administrator. Responsible for user management (creating/editing/deleting staff and patients), system settings, cross-clinic schedule oversight, and high-level analytics.
2. **DOCTOR:** Senior medical practitioner. Responsible for examining patients, writing Panchakarma prescriptions/treatment plans, tracking clinical progress, writing medical notes, viewing ratings, and setting availability.
3. **THERAPIST:** Certified Panchakarma execution specialist. Responsible for conducting daily sessions (Abhyanga, Shirodhara, etc.), marking session progress, adding progress notes, viewing assigned patients, and setting availability.
4. **RECEPTIONIST:** Front-desk officer. Responsible for walk-in patient registration, scheduling appointments on behalf of patients, processing payments, and check-ins.
5. **PATIENT:** End-user recipient of care. Responsible for booking appointments, viewing personal treatment plans, monitoring progress, downloading health reports, updating personal profile/vitals, making payments, and leaving feedback.

---

## 2. Comprehensive Role-Permission Matrix

Legend:
- `FULL`: Full CRUD access
- `SELF`: Access limited to own records/profile
- `READ`: Read-only access
- `OWN`: Access restricted to assigned/prescribed patients
- `DENIED`: No access permitted

| Feature / Resource | Action | ADMIN | DOCTOR | THERAPIST | RECEPTIONIST | PATIENT | Current Backend Implementation | Security Risk Level |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Public Auth** | Register | FULL | DENIED | DENIED | DENIED | DENIED | **ALL ROLES PUBLIC** | 🔴 HIGH |
| | Login | FULL | FULL | FULL | FULL | FULL | Role-checked on login | 🟢 SAFE |
| **User Management**| View All Users | FULL | READ | READ | READ | DENIED | `protect` only (No role check) | 🔴 HIGH |
| | View User By ID | FULL | OWN | OWN | READ | SELF | `protect` + `staff` | 🟡 MEDIUM |
| | Edit Any User | FULL | DENIED | DENIED | DENIED | DENIED | `protect` + `admin` | 🟢 SAFE |
| | Delete User | FULL | DENIED | DENIED | DENIED | DENIED | `protect` + `admin` | 🟢 SAFE |
| | Edit Profile / Vitals | SELF | SELF | SELF | SELF | SELF | `protect` (Updates `req.user._id`) | 🟢 SAFE |
| | Block/Unblock Slot | DENIED | SELF | SELF | DENIED | DENIED | `protect` (Allows any user) | 🟡 MEDIUM |
| **Appointments** | Create | FULL | READ | DENIED | FULL | SELF | `protect` (Allows any user) | 🟢 SAFE |
| | View Appointments | FULL | OWN | OWN | FULL | SELF | `protect` (Unfiltered returns ALL) | 🔴 HIGH |
| | View By ID | FULL | OWN | OWN | FULL | SELF | `protect` (No ownership check) | 🟡 MEDIUM |
| | Update Status | FULL | OWN | OWN | FULL | CANCEL | `protect` (Allows any user) | 🔴 HIGH |
| | Mark as Paid | FULL | DENIED | DENIED | FULL | SELF | `protect` (Allows any user) | 🔴 HIGH |
| | Delete Booking | FULL | DENIED | DENIED | FULL | CANCEL | `protect` (Allows any user) | 🔴 HIGH |
| **Prescriptions** | Create Plan | DENIED | FULL | DENIED | DENIED | DENIED | `protect` + `doctor` | 🟢 SAFE |
| | Update Progress | DENIED | FULL | FULL (Assigned) | DENIED | DENIED | `protect` + `therapistOrDoctor` | 🟢 SAFE |
| | View Plan By Patient| FULL | OWN | OWN | READ | SELF | `protect` (No ownership check) | 🔴 HIGH |
| **Clinical Notes** | View Patient Notes| FULL | OWN | OWN | DENIED | SELF | `protect` (No ownership check) | 🔴 HIGH |
| | Add Note | DENIED | FULL | FULL | DENIED | DENIED | `protect` + `therapistOrDoctor` | 🟢 SAFE |
| **Reports** | Admin Full Report | FULL | DENIED | DENIED | DENIED | DENIED | `protect` + `admin` | 🟢 SAFE |
| | Patient Self Report | DENIED | DENIED | DENIED | DENIED | SELF | `protect` (Fetches `req.user._id`) | 🟢 SAFE |
| **Feedback** | Submit Feedback | DENIED | DENIED | DENIED | DENIED | FULL | `protect` | 🟢 SAFE |
| | View Doctor Reviews| FULL | SELF | DENIED | DENIED | DENIED | `protect` + `doctor` | 🟢 SAFE |
| | View Therapist Reviews| FULL | DENIED | SELF | DENIED | DENIED | `protect` + `therapist` | 🟢 SAFE |

---

## 3. APIs Identified as Insufficiently Protected

### 1. `POST /api/auth/register` (Public Role Escalation)
- **Problem:** Endpoint accepts a `role` field from request body without validation. Anyone sending `{"role": "admin"}` creates a superuser account.
- **Remediation Plan:** Public registration must be restricted strictly to `role: "patient"`. Staff accounts (`doctor`, `therapist`, `receptionist`, `admin`) must require admin privileges.

### 2. `GET /api/appointments` (Global Data Exposure)
- **Problem:** When called without query parameters, it executes `Appointment.find({})` and returns all appointments across the system. A patient token can read every patient's appointment.
- **Remediation Plan:** Inject role-based filter automatically inside controller based on `req.user`:
  - If Patient: filter `patientId = req.user._id`
  - If Doctor: filter `doctorId = req.user._id`
  - If Therapist: filter `therapistId = req.user._id`
  - If Admin/Receptionist: allow viewing all

### 3. `DELETE / /PUT` on `/api/appointments/:id` (Broken Object-Level Authorization - BOLA/IDOR)
- **Problem:** Routes `DELETE /:id`, `PUT /:id/status`, and `PUT /:id/pay` are wrapped only in `protect`. Any patient can alter or delete any other patient's appointment or mark unpaid appointments as paid.
- **Remediation Plan:** Enforce staff authorization for `pay` and `status` updates, or verify `patientId` matches `req.user._id` before permitting cancellation.

### 4. `GET /api/prescriptions/patient/:patientId` & `GET /api/notes/patient/:patientId` (Patient Record Leak)
- **Problem:** Standard `protect` middleware allows any user to query any patient's prescription or note history by altering the `:patientId` parameter.
- **Remediation Plan:** Check `req.user.role`. If patient, ensure `req.user._id.toString() === req.params.patientId`. If doctor/therapist, verify active care relation.

### 5. `POST /api/users/profile/block-slot` (Provider Slot Pollution)
- **Problem:** Any logged-in patient can call this endpoint to add blocked slots to their own record or pollute slot arrays.
- **Remediation Plan:** Restrict execution to `doctor` and `therapist` roles.
