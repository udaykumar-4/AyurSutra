# AyurSutra Existing UI Analysis & Front-End Structure

## 1. Overview & Architecture

The existing AyurSutra front-end is structured as a **Vanilla Single-Page Application (SPA)** contained primarily within `index.html` (1,255 lines) and driven by `script.js` (2,360 lines). Styling is provided by `css/style.css` (12,666 bytes).

In addition to the main SPA, two legacy secondary files exist:
- `admin.html` (27 lines)
- `js/admin.js` (97 lines)
- `js/main.js` (53 lines)

---

## 2. Page & Screen Structure Analysis

### 2.1 Role Selection Screen (`#roleSelection`)
- **Visual Design:** Grid of 5 role cards (Administrator, Doctor, Therapist, Receptionist, Patient) with custom icons and gradient card styling.
- **Behavior:** Clicking a role sets `selectedLoginRole` and transitions to `#loginScreen`.

### 2.2 Login Screen (`#loginScreen`)
- **Visual Design:** Centered card form with Back button, Email input, Password input, Submit button with loading spinner, and Register prompt.
- **Behavior:** `handleLogin(event)` submits credentials + selected role to `POST /api/auth/login`. On success, stores JWT + user object in `sessionStorage.setItem('ayurUser', ...)` and transitions to role dashboard.

### 2.3 Receptionist Dashboard (`#receptionistDashboard`)
- **Tabs:**
  1. `Appointments & Booking`: Tabular list of appointments with status tags, payment status, and check-in / status buttons. Book Appointment modal trigger.
  2. `Register Walk-in Patient`: Form creating patient account (`POST /api/auth/register` with default password `patient123`).
- **Stats Bar:** Today's Appointments, Pending Payments, Total Patients.

### 2.4 Admin Dashboard (`#adminDashboard`)
- **Tabs:**
  1. `User Management`: Dynamic table with role filters, status filters, search input, status toggles, user editor, and deletion trigger.
  2. `Schedule Overview`: System-wide table of all appointments.
  3. `Reports & Analytics`: Clinic statistics summary and client-side jsPDF patient report generator.
  4. `System Settings`: Client-side form for clinic options (demo state).
- **Stats Bar:** Total Patients, Active Doctors, Active Therapists, Today's Sessions.

### 2.5 Doctor Dashboard (`#doctorDashboard`)
- **Tabs:**
  1. `Patient Records`: Patient directory search, patient chart view (vital signs, notes history).
  2. `Prescriptions`: Prescription list, "+ Create New Prescription" modal trigger (defines treatment, duration, therapist).
  3. `My Schedule`: Daily consultation calendar and "Block Time Slot" schedule availability tool.
  4. `Treatment Reports`: Summary ratings and clinical report generator trigger.
- **Stats Bar:** Active Patients, Today's Consultations, Prescribed Treatments, Success Rate.

### 2.6 Therapist Dashboard (`#therapistDashboard`)
- **Tabs:**
  1. `Today's Sessions`: List of sessions assigned to therapist with session status toggle buttons ("In Progress", "Completed").
  2. `My Assigned Patients`: Active patients undergoing treatments assigned to this therapist.
  3. `Treatment Progress`: Session counter increment control and clinical note submission.
- **Stats Bar:** Today's Sessions, Completed Today, Remaining Today, Patient Satisfaction.

### 2.7 Patient Dashboard (`#patientDashboard`)
- **Tabs:**
  1. `My Appointments`: Book new appointment button, schedule table, payment receipt trigger (`jsPDF`).
  2. `Current Treatment Plan`: Active prescription details, session counter bar, doctor notes.
  3. `Medical History`: Treatment history, document list, upload document trigger (broken API), Vitals card display & edit modal.
  4. `Profile Settings`: Personal details editor (age, gender, DOB, address, emergency contact).
  5. `Payments`: Billing status table and "Pay Now" trigger.
  6. `My Feedback`: Star rating forms for doctor, therapist, and clinic.
- **Stats Bar:** Treatment Progress %, Next Appointment, Assigned Doctor, Primary Therapist.

---

## 3. UI Aesthetics & Styling System (`css/style.css`)

- **Color Palette:**
  - Primary Gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` (Purplish Blue)
  - Success Gradient: `linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)` (Ayurvedic Mint Green)
  - Dark Accent: `#2d3748`
  - Background Wallpaper: Overlay over `background.jpg`
- **Component Styling:** Glassmorphism card effects, rounded corners (`border-radius: 12px` to `15px`), custom box shadows (`0 10px 25px rgba(0,0,0,0.1)`), flexbox responsive tables.
- **Modals:** Fixed overlay `#modalScreen` with backdrop blur, content dialogs (`.modal-content`), smooth scale-in CSS animations.

---

## 4. Mobile Responsiveness Assessment

### Existing Web Layout Mobile Support
- Uses standard CSS media queries (`@media (max-width: 768px)`).
- Nav tabs stack vertically on smaller viewports.
- Tables wrapped in `.table-responsive-container` (`overflow-x: auto`) for horizontal swipe navigation.

### Limitations for Mobile Adaptation
1. **Dense Data Tables:** Complex multi-column tables (e.g. Admin Schedule, Doctor Prescriptions) are difficult to navigate on mobile smartphones (375px - 414px widths). Mobile screens require **card-based list layouts** instead of tabular grids.
2. **Modal Dialog Overhead:** Deep nested forms inside modals (e.g. Create Prescription, Edit Vitals) overflow mobile screens, requiring dedicated view screens or full-screen bottom sheets.
3. **Session State Storage:** Web `sessionStorage` clears when closing browser tabs on mobile OS (iOS Safari / Android Chrome). Mobile apps require persistent secure storage (e.g., Secure Store / Keychain).
