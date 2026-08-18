# 01 — AyurSutra Existing Architecture Audit

## 1. System Overview

AyurSutra is a comprehensive **Ayurvedic & Panchakarma Management Platform** built with a **Node.js/Express REST API backend**, **MongoDB/Mongoose database**, and a cross-platform **React Native (Expo SDK 52) Mobile Application** supporting **Android and iOS**.

---

## 2. Technology Stack & Dependencies

### Mobile App (`/mobile`)
- **Framework:** React Native 0.76.7, Expo SDK 52 (`expo@~52.0.0`)
- **Router:** Expo Router v4 (`expo-router@~4.0.17`)
- **HTTP Client:** Axios `^1.7.9` (with JWT Bearer interceptor & hardware-backed token storage)
- **Token Security:** Expo SecureStore (`expo-secure-store@~14.0.0`)
- **Notifications:** Expo Notifications (`expo-notifications@~0.29.11`)
- **Styling:** React Native `StyleSheet` with central design tokens ([`mobile/constants/Colors.ts`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/constants/Colors.ts))
- **Environment Management:** [`mobile/config/env.ts`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/config/env.ts) supporting dynamic host IP auto-resolution for mobile devices & `localhost` for web browsers.

### Backend API (`/backend`)
- **Runtime:** Node.js v18+
- **Framework:** Express.js `^4.18.2`
- **Database:** MongoDB Atlas via Mongoose `^8.0.3`
- **Authentication:** JSON Web Tokens (`jsonwebtoken@^9.0.2`) with `bcryptjs@^2.4.3` password hashing
- **Middleware:** Custom JWT auth guard (`protect`) & role-based authorization guards (`admin`, `doctor`, `therapist`, `receptionist`, `therapistOrDoctor`, `staff`) in [`backend/middleware/authMiddleware.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/middleware/authMiddleware.js)

---

## 3. Database Schema Models Inventory (`backend/models/`)

1. **`User.js` (`users` collection):**
   - Fields: `full_name`, `email`, `password`, `role` (`admin` | `doctor` | `therapist` | `patient` | `receptionist`), `status` (`active` | `inactive`), `designation`, `condition`, `assignedDoctor` (Ref to User), `phone`, `age`, `gender`, `dob`, `address`, `emergencyContact`, `bloodGroup`, `allergies`, `heartRate`, `bloodPressure`, `weight`, `temperature`, `blockedSlots` (`[{ date, time }]`).

2. **`Appointment.js` (`appointments` collection):**
   - Fields: `patientId` (Ref User), `doctorId` (Ref User), `therapistId` (Ref User), `treatment` (String), `appointment_date` (Date), `appointment_time` (String), `status` (`scheduled` | `in-progress` | `completed` | `cancelled`), `cost` (Number), `isPaid` (Boolean).

3. **`Prescription.js` (`prescriptions` collection):**
   - Fields: `patientId` (Ref User), `doctorId` (Ref User), `therapistId` (Ref User), `treatment` (String), `duration` (Number of sessions), `progressCompleted` (Number), `plan` (String), `notes` (String), `status` (`in-progress` | `completed`).

4. **`Note.js` (`notes` collection):**
   - Fields: `patientId` (Ref User), `authorId` (Ref User), `note` (String).

5. **`Feedback.js` (`feedbacks` collection):**
   - Fields: `patientId` (Ref User), `doctorId` (Ref User), `therapistId` (Ref User), `doctorRating` (Number), `doctorFeedback` (String), `therapistRating` (Number), `therapistFeedback` (String), `overallRating` (Number), `overallFeedback` (String).

---

## 4. Navigation & Role Hierarchy (`mobile/app/`)

The mobile application utilizes **Expo Router** file-based navigation organized into strict role-based bottom tab layouts:

- 👑 **Admin Portal (`mobile/app/admin/`):** Dashboard, Users, Appointments, Reports, More.
- 👨‍⚕️ **Doctor Portal (`mobile/app/doctor/`):** Dashboard, Patients, Appointments, Prescriptions, More.
- 🧘 **Therapist Portal (`mobile/app/therapist/`):** Home, Patients, Schedule, Treatments, Profile.
- 🏢 **Receptionist Portal (`mobile/app/receptionist/`):** Dashboard, Patients, Appointments, Payments, More.
- 🌿 **Patient Portal (`mobile/app/patient/`):** Home, Appointments, Treatment, Reports, Profile.

---

## 5. Summary of Baseline Stability

All 5 user roles, authentication flows, REST endpoints, MongoDB schemas, and mobile screens are verified, functional, and fully isolated. New AI and Analytics capabilities will be added as **strictly additive extensions** without altering baseline code contracts.
