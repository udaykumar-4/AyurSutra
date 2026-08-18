# AyurSutra Mobile Application Requirements & Architecture Specifications

## 1. Overview & Mobile Transformation Strategy

To extend the AyurSutra Panchakarma Management Platform to iOS and Android, a modern mobile cross-platform client will be built using **React Native with Expo (TypeScript)**. 

The mobile application will serve as a unified native app catering to all 5 roles (**Patient**, **Doctor**, **Therapist**, **Receptionist**, and **Admin**), using role-based dynamic navigation stacks.

---

## 2. Platform Architecture Specifications

- **Framework:** React Native / Expo SDK 50+
- **Language:** TypeScript
- **Navigation:** React Navigation (Native Stack + Bottom Tabs)
- **State Management:** Zustand or React Context + TanStack Query (React Query v5) for API caching
- **Secure Token Storage:** `expo-secure-store` (Hardware-backed iOS Keychain & Android Keystore)
- **UI & Component System:** Custom Tailwind CSS (via NativeWind v4) with custom Glassmorphism & Ayurvedic mint green palette
- **PDF Generation & Document Viewer:** `react-native-html-to-pdf` or `expo-print` + `react-native-pdf`
- **Push Notifications:** `expo-notifications` for session reminders and status updates

---

## 3. Role-Specific Mobile Requirements

### 3.1 Patient Mobile Features
1. **Authentication & Profile:** Touch ID / Face ID quick login, bio-data view, emergency contacts, vital signs entry.
2. **Appointment Engine:** Booking wizard (Treatment selector, Doctor/Therapist picker, date/time availability slot calendar), appointment status timeline, online payment integration simulation.
3. **Treatment Tracking:** Interactive Panchakarma session progress bar (e.g. 5 of 10 Abhyanga sessions completed), treatment plan overview, doctor's dietary/lifestyle advice.
4. **Document Vault:** Mobile camera document scanner/uploader for lab reports, PDF full-report downloader.
5. **Feedback & Ratings:** Star rating controls and feedback submission for doctor, therapist, and clinic.

### 3.2 Doctor Mobile Features
1. **Clinical Consultations Dashboard:** Daily consultation schedule, quick patient search.
2. **Prescription Generator:** Mobile-friendly step-by-step prescription builder (Patient selector, Treatment selection, Session duration, Therapist assignment, instructions).
3. **Schedule & Availability Manager:** Interactive calendar toggle to block/unblock time slots.
4. **Patient Chart Viewer:** Medical history, past prescriptions, vital signs trends, clinical notes log.
5. **Reviews & Rating View:** Feedback list filtered for logged-in doctor.

### 3.3 Therapist Mobile Features
1. **Today's Session Queue:** Daily therapy list with status toggle buttons (Scheduled -> In Progress -> Completed).
2. **Assigned Patient Cards:** Quick patient overview, active prescription details.
3. **Session Progress Logger:** Increment completed session count with one-tap progress save.
4. **Progress Notes:** Voice-to-text or typed clinical observation note logger.
5. **Availability Slot Management:** Block/unblock personal working hours.

### 3.4 Receptionist Mobile Features
1. **Front-Desk Dashboard:** Today's clinic appointment schedule, patient check-in toggle.
2. **Walk-in Registration:** Mobile registration form for new patients with instant account generation.
3. **Appointment Scheduling:** Book appointments on behalf of any patient.
4. **Billing & Settlement:** Collect payments and mark appointments as paid (`isPaid: true`).

### 3.5 Admin Mobile Features
1. **Clinic Control Center:** High-level metrics (Total Patients, Active Doctors, Active Therapists, Daily Revenue, Today's Sessions).
2. **User Management:** Staff & Patient directory, role assignment, account status toggling (Active/Inactive), account deletion.
3. **Global Schedule Viewer:** Filterable master schedule view across all staff and patients.
4. **System Settings & Analytics:** Report generation and system configuration controls.

---

## 4. Backend Enhancements Required for Mobile Support

To support the mobile client smoothly without breaking existing web functionality, the following backend endpoints must be added/refactored:

1. **Document Management API (`/api/documents`):**
   - Implement `POST /api/documents` (Base64 or Multer file upload)
   - Implement `GET /api/documents/patient/:patientId`
   - Implement `DELETE /api/documents/:id`
2. **Push Notifications API (`/api/notifications`):**
   - Register push token (`POST /api/users/push-token`)
   - Send automated push notifications when appointment status changes.
3. **Mobile Security Layer:**
   - Address all security gaps identified in `06-security-audit.md` prior to mobile launch.
