# AyurSutra Project Audit & Architectural Analysis

## 1. Executive Summary
**AyurSutra** is a Panchakarma Management System designed for Ayurvedic hospitals and clinics. It aims to support 5 primary user roles: **Admin**, **Doctor**, **Therapist**, **Receptionist**, and **Patient**. 

The current codebase is structured as a two-tier system:
- **Backend:** Node.js + Express REST API connecting to MongoDB via Mongoose.
- **Frontend:** Single-Page Application (SPA) built with Vanilla HTML5, CSS3, and JavaScript, alongside legacy multi-page scripts.

---

## 2. Directory & Component Breakdown

```
ayursutra/
├── backend/
│   ├── .env                    # Database URI & JWT Secret
│   ├── server.js               # Main Express application entry point
│   ├── package.json            # Backend dependencies & scripts
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT authentication & role-based middleware
│   ├── models/                 # Mongoose Data Models
│   │   ├── user.js             # User Schema (All 5 roles)
│   │   ├── appointment.js      # Appointment Schema
│   │   ├── prescription.js     # Prescription / Treatment Plan Schema
│   │   ├── note.js             # Clinical Notes Schema
│   │   └── feedback.js         # Patient Feedback Schema
│   ├── routes/                 # Express Routers
│   │   ├── index.js            # Main router (/api aggregator)
│   │   ├── authRoutes.js       # Authentication routes (/api/auth)
│   │   ├── userRoutes.js       # User management & slots (/api/users)
│   │   ├── appointmentRoutes.js# Appointment operations (/api/appointments)
│   │   ├── prescriptionRoutes.js# Prescription tracking (/api/prescriptions)
│   │   ├── noteRoutes.js       # Clinical notes (/api/notes)
│   │   ├── reportRoutes.js     # Patient report aggregation (/api/reports)
│   │   └── feedbackRoutes.js   # Feedback submissions (/api/feedback)
│   └── controllers/            # Request Handlers & Business Logic
│       ├── authController.js
│       ├── userController.js
│       ├── appointmentsController.js
│       ├── prescriptionController.js
│       ├── noteController.js
│       ├── reportController.js
│       └── feedbackController.js
└── frontend/
    ├── index.html              # Main Single-Page Application HTML (1255 lines)
    ├── admin.html              # Legacy standalone admin dashboard (27 lines)
    ├── background.jpg          # UI wallpaper asset
    ├── css/
    │   └── style.css           # Global stylesheet (12,666 bytes)
    └── js/
        ├── script.js           # Main SPA logic (2360 lines)
        ├── admin.js            # Legacy unauthenticated fetch script (97 lines)
        └── main.js             # Legacy appointment form script (53 lines)
```

---

## 3. Technology Stack & Dependencies

### Backend
- **Runtime Environment:** Node.js (v16+)
- **Framework:** Express.js (`^4.18.2`)
- **Database:** MongoDB Atlas (Mongoose ODM `^8.0.0`)
- **Authentication:** JSON Web Tokens (`jsonwebtoken ^9.0.2`), `bcryptjs ^3.0.3`
- **Utility / CORS:** `dotenv ^16.0.3`, `cors ^2.8.5`
- **Development Tooling:** `nodemon ^3.0.0`

### Frontend
- **Markup & Layout:** HTML5 Semantic Structure with CSS Flexbox & Grid.
- **Iconography & PDF:** FontAwesome (`v6.0.0`), jsPDF (`v2.5.1`).
- **State & Session:** Browser `sessionStorage` (`ayurUser` JSON payload containing user metadata & JWT token).
- **Network Client:** Native Web Fetch API via custom wrapper `authFetch()`.

---

## 4. Module-by-Module Audit

### 4.1 Authentication & Role Authorization Module
- **Implementation:** Custom `protect` middleware parses `Authorization: Bearer <token>`, verifies JWT secret, and populates `req.user`. Role helper functions (`admin`, `doctor`, `therapist`, `receptionist`, `therapistOrDoctor`, `staff`) check `req.user.role`.
- **Verified Gaps:**
  1. `POST /api/auth/register` allows **unrestricted role specification**. Anyone can register an account with `role: "admin"`.
  2. `loginUser` enforces role matching against login screen parameters, but password verification passes even if role mismatch occurs prior to returning 401.

### 4.2 User Management & Availability Slot Module
- **Implementation:** `user.js` model handles all 5 user types within a single schema using `role` enum. Doctor/Therapist slot blocking is supported via `blockedSlots` array on User schema.
- **Verified Gaps:**
  1. `GET /api/users` is protected ONLY by `protect` middleware without role restrictions. Any logged-in patient can list all system users.
  2. `POST /api/users/profile/block-slot` and `DELETE /api/users/profile/unblock-slot/:slotId` do not check if `req.user.role` is a medical provider (`doctor` or `therapist`).

### 4.3 Appointment Management Module
- **Implementation:** Supports creating, retrieving, updating status, deleting, slot conflict detection, cost calculation based on treatment type, and setting `isPaid: true`.
- **Verified Gaps:**
  1. `GET /api/appointments` returns ALL appointments in the system when no query filters are provided. Patients calling `GET /api/appointments` without query params receive all patient appointments.
  2. `DELETE /api/appointments/:id`, `PUT /api/appointments/:id/status`, and `PUT /api/appointments/:id/pay` are guarded ONLY by `protect`. Any logged-in patient can modify, delete, or change payment status of any appointment.
  3. `admin.js` and `main.js` in frontend call obsolete appointment endpoints with incorrect schemas (e.g. `patientName`, `service`, `appointmentDate` instead of `patientId`, `treatment`, `appointment_date`, `appointment_time`).

### 4.4 Prescription & Treatment Progress Module
- **Implementation:** Doctors create prescriptions defining treatment, duration (days), assigned therapist, and notes. Doctors/therapists update `progressCompleted` count. Status automatically turns to `'completed'` when `progressCompleted >= duration`.
- **Verified Gaps:**
  1. `GET /api/prescriptions/patient/:patientId` has no ownership validation. Any patient can view any other patient's prescriptions.
  2. No validation ensuring that the `patientId`, `doctorId`, and `therapistId` passed in prescription creation belong to users with those actual roles.

### 4.5 Notes Module
- **Implementation:** Allows doctors and therapists (`therapistOrDoctor` middleware) to post clinical notes for a patient.
- **Verified Gaps:**
  1. `GET /api/notes/patient/:patientId` lacks patient ownership check.

### 4.6 Reports & Analytics Module
- **Implementation:** Aggregates user details, appointments, prescriptions, and notes. Admin endpoint `GET /api/reports/patient/:patientId` requires `admin`. Self-report endpoint `GET /api/reports/my-report` retrieves current user's medical history.
- **Verified Gaps:**
  1. PDF generation relies entirely on client-side jsPDF manipulation in `script.js` without server-side validation or templating.

### 4.7 Feedback Module
- **Implementation:** Patients submit ratings (1-5) and text feedback for doctor, therapist, and overall clinic. Doctors and therapists view their respective feedback via `GET /api/feedback/doctor` and `GET /api/feedback/therapist`.
- **Verified Gaps:**
  1. `POST /api/feedback` automatically selects `assignedDoctor` and active prescription `therapistId`, but fails if no active prescription is present without clear fallback handling.

### 4.8 Documents Module (Missing Backend Implementation)
- **Verified Gap:** `script.js` line 1850 calls `POST /api/documents` with Base64 document payload (`name`, `type`, `fileData`). **No route, model, or controller exists for documents in the backend.** This operation fails with a 404 error.

---

## 5. Summary of Key Architectural Weaknesses

1. **Broken Access Control (IDOR & Missing Authorization):** Routes for appointments, prescriptions, notes, and user listing rely on basic token validation without role or resource ownership checks.
2. **Unrestricted Registration Role Escalation:** Public registration allows administrative account creation.
3. **Monolithic Frontend Architecture:** `script.js` is a single 2360-line file handling DOM updates, auth, API calls, dynamic HTML generation, and PDF export.
4. **Orphan Backend Features & Broken Scripts:** Legacy `admin.js` and `main.js` invoke outdated endpoint structures without JWT headers. Front-end references missing endpoints (`/api/documents`).
5. **Session Storage Vulnerability:** Storing JWT in `sessionStorage` leaves tokens susceptible to XSS.
