# AyurSutra Backend API Inventory

## Overview
This document contains a complete inventory of all REST API endpoints currently defined in the AyurSutra Express backend router (`/backend/routes/`).

---

## 1. Authentication Routes (`/api/auth`)

### 1.1 Register User
- **METHOD:** `POST`
- **ENDPOINT:** `/api/auth/register`
- **AUTHENTICATION:** Public (None)
- **ROLE:** Unrestricted (Caller can supply any role: `admin`, `doctor`, `therapist`, `patient`, `receptionist`)
- **REQUEST BODY:**
  ```json
  {
    "full_name": "String (required)",
    "email": "String (required)",
    "password": "String (required)",
    "role": "String (required: admin|doctor|therapist|patient|receptionist)",
    "designation": "String (optional)"
  }
  ```
- **PARAMETERS:** None
- **RESPONSE:**
  ```json
  {
    "_id": "ObjectId",
    "full_name": "String",
    "email": "String",
    "role": "String",
    "token": "JWT String"
  }
  ```
- **PURPOSE:** Register a new user account in the system and return an initial JWT access token.

### 1.2 Login User
- **METHOD:** `POST`
- **ENDPOINT:** `/api/auth/login`
- **AUTHENTICATION:** Public (None)
- **ROLE:** All roles
- **REQUEST BODY:**
  ```json
  {
    "email": "String (required)",
    "password": "String (required)",
    "role": "String (required)"
  }
  ```
- **PARAMETERS:** None
- **RESPONSE:**
  ```json
  {
    "_id": "ObjectId",
    "full_name": "String",
    "email": "String",
    "role": "String",
    "token": "JWT String",
    "status": "String",
    "lastLogin": "Date String",
    "...userObjectFields": "..."
  }
  ```
- **PURPOSE:** Authenticate a user by verifying email, password hash, and matching assigned role. Updates `lastLogin` timestamp upon success.

---

## 2. User Management Routes (`/api/users`)

### 2.1 Update Own Profile
- **METHOD:** `PUT`
- **ENDPOINT:** `/api/users/profile`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:**
  ```json
  {
    "full_name": "String (optional)",
    "email": "String (optional)",
    "age": "Number (optional)",
    "gender": "String (optional)",
    "dob": "Date (optional)",
    "phone": "String (optional)",
    "address": "String (optional)",
    "emergencyContact": "String (optional)",
    "bloodGroup": "String (optional)",
    "allergies": "String (optional)",
    "heartRate": "String (optional)",
    "bloodPressure": "String (optional)",
    "weight": "String (optional)",
    "temperature": "String (optional)",
    "password": "String (optional)"
  }
  ```
- **PARAMETERS:** None
- **RESPONSE:** Updated user JSON object including re-issued `token`.
- **PURPOSE:** Allows the currently authenticated user to update their contact details, vital signs, or password.

### 2.2 Block Time Slot
- **METHOD:** `POST`
- **ENDPOINT:** `/api/users/profile/block-slot`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user (intended for Doctors & Therapists)
- **REQUEST BODY:**
  ```json
  {
    "date": "YYYY-MM-DD (required)",
    "time": "HH:MM (required)"
  }
  ```
- **PARAMETERS:** None
- **RESPONSE:** Updated user JSON object containing updated `blockedSlots` array.
- **PURPOSE:** Add an unavailable date and time slot to the user's provider profile to prevent appointment booking.

### 2.3 Delete Blocked Time Slot
- **METHOD:** `DELETE`
- **ENDPOINT:** `/api/users/profile/unblock-slot/:slotId`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user (intended for Doctors & Therapists)
- **REQUEST BODY:** None
- **PARAMETERS:** `slotId` (Path parameter - subdocument ObjectId of the blocked slot)
- **RESPONSE:** Updated user JSON object with the specified slot removed.
- **PURPOSE:** Unblock a previously restricted time slot on the provider's schedule.

### 2.4 Get All Users
- **METHOD:** `GET`
- **ENDPOINT:** `/api/users`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user (intended for Admin/Staff)
- **REQUEST BODY:** None
- **PARAMETERS:** `role` (Query parameter, optional - filter by `doctor`, `therapist`, `patient`, `receptionist`, `admin`)
- **RESPONSE:** Array of User objects (password omitted, `assignedDoctor` populated with `full_name`).
- **PURPOSE:** Retrieve user listings for management, populating dropdowns, and schedule filtering.

### 2.5 Get User By ID
- **METHOD:** `GET`
- **ENDPOINT:** `/api/users/:id`
- **AUTHENTICATION:** Required (`protect`, `staff`)
- **ROLE:** Admin, Doctor, Therapist, Receptionist
- **REQUEST BODY:** None
- **PARAMETERS:** `id` (Path parameter - User ObjectId)
- **RESPONSE:** Single User object (password omitted, `assignedDoctor` populated).
- **PURPOSE:** Fetch full profile details for a specific user.

### 2.6 Update User (Admin)
- **METHOD:** `PUT`
- **ENDPOINT:** `/api/users/:id`
- **AUTHENTICATION:** Required (`protect`, `admin`)
- **ROLE:** Admin only
- **REQUEST BODY:**
  ```json
  {
    "full_name": "String",
    "email": "String",
    "role": "String",
    "status": "active|inactive",
    "phone": "String",
    "age": "Number",
    "designation": "String",
    "assignedDoctor": "ObjectId"
  }
  ```
- **PARAMETERS:** `id` (Path parameter - User ObjectId)
- **RESPONSE:** Updated User JSON object.
- **PURPOSE:** Admin functionality to modify account details, status, role, or doctor assignment for any user.

### 2.7 Delete User (Admin)
- **METHOD:** `DELETE`
- **ENDPOINT:** `/api/users/:id`
- **AUTHENTICATION:** Required (`protect`, `admin`)
- **ROLE:** Admin only
- **REQUEST BODY:** None
- **PARAMETERS:** `id` (Path parameter - User ObjectId)
- **RESPONSE:** `{ "message": "User removed" }`
- **PURPOSE:** Admin function to permanently delete a user account.

---

## 3. Appointment Routes (`/api/appointments`)

### 3.1 Get Appointments
- **METHOD:** `GET`
- **ENDPOINT:** `/api/appointments`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:** None
- **PARAMETERS:** (Query parameters, optional) `patientId`, `doctorId`, `therapistId`
- **RESPONSE:** Array of Appointment objects (with `patientId`, `doctorId`, `therapistId` populated with `full_name`), sorted by date descending.
- **PURPOSE:** Fetch appointments matching search criteria, or all system appointments if no parameters are supplied.

### 3.2 Create Appointment
- **METHOD:** `POST`
- **ENDPOINT:** `/api/appointments`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user (Patient, Receptionist, Admin)
- **REQUEST BODY:**
  ```json
  {
    "patientId": "ObjectId (required)",
    "doctorId": "ObjectId (optional)",
    "therapistId": "ObjectId (optional)",
    "treatment": "String (required)",
    "appointment_date": "YYYY-MM-DD (required)",
    "appointment_time": "HH:MM (required)"
  }
  ```
- **PARAMETERS:** None
- **RESPONSE:** Created Appointment object (201 Created) containing calculated `cost`.
- **PURPOSE:** Book an appointment. Validates slot availability against staff schedule and provider `blockedSlots`, assigning pre-configured treatment pricing.

### 3.3 Get Appointment By ID
- **METHOD:** `GET`
- **ENDPOINT:** `/api/appointments/:id`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:** None
- **PARAMETERS:** `id` (Path parameter - Appointment ObjectId)
- **RESPONSE:** Appointment object with populated staff and patient names.
- **PURPOSE:** Retrieve detailed information for a single appointment.

### 3.4 Delete Appointment
- **METHOD:** `DELETE`
- **ENDPOINT:** `/api/appointments/:id`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:** None
- **PARAMETERS:** `id` (Path parameter - Appointment ObjectId)
- **RESPONSE:** `{ "message": "Appointment removed" }`
- **PURPOSE:** Cancel/Remove an appointment from the database.

### 3.5 Update Appointment Status
- **METHOD:** `PUT`
- **ENDPOINT:** `/api/appointments/:id/status`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:**
  ```json
  {
    "status": "scheduled|completed|cancelled|in-progress|confirmed"
  }
  ```
- **PARAMETERS:** `id` (Path parameter - Appointment ObjectId)
- **RESPONSE:** Updated Appointment object.
- **PURPOSE:** Change the state of an appointment lifecycle.

### 3.6 Mark Appointment as Paid
- **METHOD:** `PUT`
- **ENDPOINT:** `/api/appointments/:id/pay`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:** None
- **PARAMETERS:** `id` (Path parameter - Appointment ObjectId)
- **RESPONSE:** Updated Appointment object with `isPaid: true`.
- **PURPOSE:** Mark an appointment billing charge as settled.

---

## 4. Prescription & Treatment Routes (`/api/prescriptions`)

### 4.1 Create Prescription
- **METHOD:** `POST`
- **ENDPOINT:** `/api/prescriptions`
- **AUTHENTICATION:** Required (`protect`, `doctor`)
- **ROLE:** Doctor only
- **REQUEST BODY:**
  ```json
  {
    "patientId": "ObjectId (required)",
    "doctorId": "ObjectId (required)",
    "therapistId": "ObjectId (required)",
    "treatment": "String (required)",
    "duration": "Number (required - days/sessions)",
    "plan": "String (optional)",
    "notes": "String (optional)"
  }
  ```
- **PARAMETERS:** None
- **RESPONSE:** Created Prescription object (201 Created).
- **PURPOSE:** Issues a new Panchakarma treatment plan assigning a patient to a therapist for a specified duration.

### 4.2 Update Prescription Progress
- **METHOD:** `PUT`
- **ENDPOINT:** `/api/prescriptions/:id/progress`
- **AUTHENTICATION:** Required (`protect`, `therapistOrDoctor`)
- **ROLE:** Doctor or Therapist
- **REQUEST BODY:**
  ```json
  {
    "progressCompleted": "Number (required - completed session count)"
  }
  ```
- **PARAMETERS:** `id` (Path parameter - Prescription ObjectId)
- **RESPONSE:** Updated Prescription object. Automatically transitions `status` to `'completed'` when `progressCompleted >= duration`.
- **PURPOSE:** Log therapy session completion progress.

### 4.3 Get Prescriptions for Patient
- **METHOD:** `GET`
- **ENDPOINT:** `/api/prescriptions/patient/:patientId`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:** None
- **PARAMETERS:** `patientId` (Path parameter - User ObjectId)
- **RESPONSE:** Array of Prescription objects populated with doctor and therapist details.
- **PURPOSE:** Fetch treatment plans for a specific patient.

### 4.4 Get Prescription By ID
- **METHOD:** `GET`
- **ENDPOINT:** `/api/prescriptions/:id`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:** None
- **PARAMETERS:** `id` (Path parameter - Prescription ObjectId)
- **RESPONSE:** Single Prescription object.
- **PURPOSE:** Fetch specific prescription details.

### 4.5 Get Prescriptions for Doctor
- **METHOD:** `GET`
- **ENDPOINT:** `/api/prescriptions/doctor/:doctorId`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:** None
- **PARAMETERS:** `doctorId` (Path parameter - User ObjectId)
- **RESPONSE:** Array of Prescription objects created by the specified doctor.
- **PURPOSE:** Retrieve doctor's active and past treatment prescriptions.

### 4.6 Get Prescriptions for Therapist
- **METHOD:** `GET`
- **ENDPOINT:** `/api/prescriptions/therapist/:therapistId`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:** None
- **PARAMETERS:** `therapistId` (Path parameter - User ObjectId)
- **RESPONSE:** Array of Prescription objects assigned to the therapist.
- **PURPOSE:** Retrieve therapist's assigned treatment sessions.

---

## 5. Clinical Note Routes (`/api/notes`)

### 5.1 Get Notes for Patient
- **METHOD:** `GET`
- **ENDPOINT:** `/api/notes/patient/:patientId`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user
- **REQUEST BODY:** None
- **PARAMETERS:** `patientId` (Path parameter - User ObjectId)
- **RESPONSE:** Array of Note objects (populated with `authorId` `full_name` and `role`), sorted by date descending.
- **PURPOSE:** Fetch all clinical progress notes for a patient.

### 5.2 Create Note
- **METHOD:** `POST`
- **ENDPOINT:** `/api/notes`
- **AUTHENTICATION:** Required (`protect`, `therapistOrDoctor`)
- **ROLE:** Doctor or Therapist
- **REQUEST BODY:**
  ```json
  {
    "patientId": "ObjectId (required)",
    "note": "String (required)"
  }
  ```
- **PARAMETERS:** None
- **RESPONSE:** Created Note object (201 Created) with populated author details.
- **PURPOSE:** Attach a new clinical observation note to a patient's chart.

---

## 6. Report Routes (`/api/reports`)

### 6.1 Get Patient Full Report (Admin)
- **METHOD:** `GET`
- **ENDPOINT:** `/api/reports/patient/:patientId`
- **AUTHENTICATION:** Required (`protect`, `admin`)
- **ROLE:** Admin only
- **REQUEST BODY:** None
- **PARAMETERS:** `patientId` (Path parameter - User ObjectId)
- **RESPONSE:** Aggregated payload containing `user`, `appointments`, `prescriptions`, and `notes`.
- **PURPOSE:** Generate comprehensive medical summary data for administrative or export purposes.

### 6.2 Get My Report (Patient Self-Service)
- **METHOD:** `GET`
- **ENDPOINT:** `/api/reports/my-report`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user (intended for Patients)
- **REQUEST BODY:** None
- **PARAMETERS:** None
- **RESPONSE:** Aggregated payload containing logged-in user's own `user`, `appointments`, `prescriptions`, and `notes`.
- **PURPOSE:** Allow a patient to download or view their complete health and treatment history.

---

## 7. Feedback Routes (`/api/feedback`)

### 7.1 Submit Feedback
- **METHOD:** `POST`
- **ENDPOINT:** `/api/feedback`
- **AUTHENTICATION:** Required (`protect`)
- **ROLE:** Any authenticated user (intended for Patients)
- **REQUEST BODY:**
  ```json
  {
    "doctorRating": "Number (1-5, optional)",
    "doctorFeedback": "String (optional)",
    "therapistRating": "Number (1-5, optional)",
    "therapistFeedback": "String (optional)",
    "overallRating": "Number (1-5, required)",
    "overallFeedback": "String (optional)"
  }
  ```
- **PARAMETERS:** None
- **RESPONSE:** Created Feedback object (201 Created).
- **PURPOSE:** Enables patient to rate clinic, doctor, and therapist care.

### 7.2 Get Feedback for Doctor
- **METHOD:** `GET`
- **ENDPOINT:** `/api/feedback/doctor`
- **AUTHENTICATION:** Required (`protect`, `doctor`)
- **ROLE:** Doctor only
- **REQUEST BODY:** None
- **PARAMETERS:** None
- **RESPONSE:** Array of Feedback objects matching `doctorId = req.user._id`.
- **PURPOSE:** Enables doctor to review patient reviews and ratings.

### 7.3 Get Feedback for Therapist
- **METHOD:** `GET`
- **ENDPOINT:** `/api/feedback/therapist`
- **AUTHENTICATION:** Required (`protect`, `therapist`)
- **ROLE:** Therapist only
- **REQUEST BODY:** None
- **PARAMETERS:** None
- **RESPONSE:** Array of Feedback objects matching `therapistId = req.user._id`.
- **PURPOSE:** Enables therapist to review patient reviews and ratings.
