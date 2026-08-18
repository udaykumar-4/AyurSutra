# AyurSutra Database Models & Schemas

## Database Engine & Config
- **DBMS:** MongoDB
- **Object Data Modeling (ODM):** Mongoose (`v8.0.0`)
- **Connection String:** Configured via `MONGO_URI` in `.env` (`mongodb+srv://...`)
- **Timestamps:** Standard Mongoose option `{ timestamps: true }` enabled on all models (adds `createdAt` and `updatedAt` Date fields).

---

## 1. User Model (`models/user.js`)

Defines all system actors (**Admin**, **Doctor**, **Therapist**, **Patient**, **Receptionist**) in a single collection using a discriminator `role` field.

### Fields & Schema Definition
| Field | Type | Rules / Validation | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Unique document identifier |
| `full_name` | `String` | Required | User's complete name |
| `email` | `String` | Required, Unique, Lowercase | Primary account login identifier |
| `password` | `String` | Required | Bcrypt hashed password |
| `role` | `String` | Required, Enum: `['admin', 'doctor', 'therapist', 'patient', 'receptionist']` | Access level role |
| `status` | `String` | Enum: `['active', 'inactive']`, Default: `'active'` | Account activity state |
| `designation` | `String` | Optional | Job title / specialty for doctors/therapists |
| `condition` | `String` | Optional | Primary medical diagnosis (for patients) |
| `assignedDoctor` | `ObjectId` | Ref: `'User'` | Reference to primary doctor (for patients) |
| `phone` | `String` | Optional | Contact phone number |
| `age` | `Number` | Optional | Patient age |
| `gender` | `String` | Optional | Male / Female / Other |
| `dob` | `Date` | Optional | Date of birth |
| `address` | `String` | Optional | Residential address |
| `emergencyContact` | `String` | Optional | Emergency contact name & phone |
| `bloodGroup` | `String` | Optional | E.g., A+, O-, etc. |
| `allergies` | `String` | Optional | Known allergies description |
| `lastLogin` | `Date` | Optional | Timestamp of last successful login |
| `heartRate` | `String` | Optional | Vitals record (e.g. "72 bpm") |
| `bloodPressure` | `String` | Optional | Vitals record (e.g. "120/80 mmHg") |
| `weight` | `String` | Optional | Vitals record (e.g. "68 kg") |
| `temperature` | `String` | Optional | Vitals record (e.g. "98.6 °F") |
| `blockedSlots` | `Array` | Subdocument array | Provider unavailable times |
| `blockedSlots.date`| `Date` | Required | Unavailable calendar date |
| `blockedSlots.time`| `String` | Required | Unavailable time string (e.g. "10:00") |
| `createdAt` | `Date` | Auto-generated | Record creation date |
| `updatedAt` | `Date` | Auto-generated | Record last modification date |

### Hooks & Instance Methods
- **Pre-Save Hook:** Automatically hashes plain-text `password` using `bcrypt.genSalt(10)` if modified.
- **Instance Method:** `matchPassword(enteredPassword)` — asynchronous comparison returning boolean.

---

## 2. Appointment Model (`models/appointment.js`)

Manages scheduling of consultations, therapy sessions, and front-desk billing.

### Fields & Schema Definition
| Field | Type | Rules / Validation | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Unique appointment identifier |
| `patientId` | `ObjectId` | Required, Ref: `'User'` | Patient associated with booking |
| `doctorId` | `ObjectId` | Ref: `'User'` | Assigned Doctor (if consultation) |
| `therapistId` | `ObjectId` | Ref: `'User'` | Assigned Therapist (if treatment) |
| `treatment` | `String` | Required | Treatment type (Consultation, Abhyanga, etc.) |
| `appointment_date`| `Date` | Required | Scheduled session date |
| `appointment_time`| `String` | Required | Scheduled session time string ("09:00") |
| `status` | `String` | Enum: `['scheduled', 'completed', 'cancelled', 'in-progress', 'confirmed']`, Default: `'scheduled'` | Booking lifecycle state |
| `specialRequirements`| `String` | Optional | Patient or doctor notes for session |
| `cost` | `Number` | Optional | Calculated monetary cost in INR |
| `isPaid` | `Boolean` | Default: `false` | Billing payment flag |
| `createdAt` | `Date` | Auto-generated | Booking timestamp |
| `updatedAt` | `Date` | Auto-generated | Last status update timestamp |

---

## 3. Prescription Model (`models/prescription.js`)

Represents long-term Panchakarma treatment plans issued by doctors and executed by therapists.

### Fields & Schema Definition
| Field | Type | Rules / Validation | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Unique prescription identifier |
| `patientId` | `ObjectId` | Required, Ref: `'User'` | Target patient |
| `doctorId` | `ObjectId` | Required, Ref: `'User'` | Prescribing doctor |
| `therapistId` | `ObjectId` | Required, Ref: `'User'` | Executing therapist |
| `treatment` | `String` | Required | Therapy name (e.g. "Shirodhara") |
| `duration` | `Number` | Required | Total prescribed sessions/days |
| `plan` | `String` | Optional | Detailed treatment protocol |
| `notes` | `String` | Optional | Doctor instructions & dietary advice |
| `status` | `String` | Enum: `['in-progress', 'completed']`, Default: `'in-progress'` | Treatment plan status |
| `progressCompleted`| `Number` | Default: `0` | Number of completed sessions |
| `createdAt` | `Date` | Auto-generated | Prescription issue date |
| `updatedAt` | `Date` | Auto-generated | Last progress update date |

---

## 4. Note Model (`models/note.js`)

Clinical observations logged by doctors or therapists during patient care.

### Fields & Schema Definition
| Field | Type | Rules / Validation | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Unique note identifier |
| `patientId` | `ObjectId` | Required, Ref: `'User'` | Target patient |
| `authorId` | `ObjectId` | Required, Ref: `'User'` | Doctor or Therapist author |
| `note` | `String` | Required | Clinical entry text |
| `createdAt` | `Date` | Auto-generated | Clinical entry timestamp |

---

## 5. Feedback Model (`models/feedback.js`)

Patient reviews evaluating healthcare services.

### Fields & Schema Definition
| Field | Type | Rules / Validation | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` | Auto-generated | Unique feedback identifier |
| `patientId` | `ObjectId` | Required, Ref: `'User'` | Submitting patient |
| `doctorId` | `ObjectId` | Ref: `'User'` | Evaluated Doctor |
| `doctorRating` | `Number` | Min: 1, Max: 5 | Doctor rating score |
| `doctorFeedback` | `String` | Optional | Comments for doctor |
| `therapistId` | `ObjectId` | Ref: `'User'` | Evaluated Therapist |
| `therapistRating` | `Number` | Min: 1, Max: 5 | Therapist rating score |
| `therapistFeedback`| `String` | Optional | Comments for therapist |
| `overallRating` | `Number` | Required, Min: 1, Max: 5 | Overall clinic satisfaction rating |
| `overallFeedback` | `String` | Optional | Clinic review comments |
| `createdAt` | `Date` | Auto-generated | Feedback submission date |

---

## Entity Relationship Model Summary
```
[User (Patient)] 1 <---> N [Appointment] N <---> 1 [User (Doctor/Therapist)]
[User (Patient)] 1 <---> N [Prescription] N <---> 1 [User (Doctor/Therapist)]
[User (Patient)] 1 <---> N [Note]         N <---> 1 [User (Author)]
[User (Patient)] 1 <---> N [Feedback]     N <---> 1 [User (Doctor/Therapist)]
```
