# 03 — AyurSutra Data Requirements & Categorization (Revised)

## 1. Feature-by-Feature Data Scope

### Feature 1: AI Disease Prediction (Clinical Decision Support)
- **Target Role:** Authorized Doctors (Decision Support only).
- **Scope & Scope Restrictions:**
  - Analyzes presenting symptoms, age, gender, vitals (`bloodPressure`, `heartRate`, `weight`, `temperature`), allergies, existing condition string, past clinical notes, and treatment progress history.
  - Does NOT infer unrecorded medical data.
  - Does NOT output a confirmed diagnosis; outputs differential conditions with confidence ratings for doctor review.

---

### Feature 2: AI Treatment Recommendation (Clinical Decision Support)
- **Target Role:** Authorized Doctors.
- **Unrestricted Treatment Scope:**
  - Recommends options across ALL treatment categories available in AyurSutra (e.g., Consultation, Abhyanga, Shirodhara, Swedana, Pizhichil, herbal lifestyle guidance, duration, and session plans).
  - Panchakarma is included where appropriate, but is **not an artificial restriction** on the feature.
- **Output:** Suggested treatment options, rationale, expected objectives, potential considerations, confidence rating, and clinician review requirement. Does NOT automatically alter prescriptions.

---

### Feature 3: Outcome Analytics Dashboard
Analytics metrics are strictly categorized into four transparent tiers based on authoritative database evidence:

#### A. Operational Metrics (Deterministic DB Aggregations)
- **Data Source:** `Appointment` collection.
- **Metrics:** Total appointment volume, completion count, cancellation count, cancellation rate %, slot utilization %.

#### B. Treatment Adherence & Progress Metrics (Deterministic DB Aggregations)
- **Data Source:** `Prescription` collection.
- **Metrics:** Total prescribed sessions vs completed sessions (`progressCompleted` / `duration`), treatment progress %, plan completion rate %.

#### C. Patient-Reported Outcomes (Deterministic DB Aggregations)
- **Data Source:** `Feedback` collection.
- **Metrics:** Doctor ratings (1-5 stars), therapist ratings (1-5 stars), overall satisfaction score, qualitative patient feedback summaries.

#### D. Clinical Outcome Metrics
- **Data Source:** `User` & `Note` collections (vitals history e.g. blood pressure / weight changes across visits).
- **Strict Data Integrity Rule:** Clinical outcome metrics are included ONLY when verified, empirical vitals data exists in the database. **Zero clinical outcome data will be invented or fabricated.**

---

### Feature 4: Smart Appointment Scheduling with Conflict Optimization
- **Target Roles:** Receptionist, Doctor, Therapist, Admin, Patient (Request view).
- **Inputs:** Staff `blockedSlots`, existing `Appointment` schedule, treatment duration.
- **Outputs:** Conflict detection list, ranked available slots with rationale. Zero automatic/silent appointment movements.

---

### Feature 5: AI Chatbot with Personalized Diet & Therapy Guidance
- **Target Roles:** Authenticated Patients (Personalized Wellness Assistant), Staff (Professional Operational Assistant).
- **Inputs:** Authenticated patient profile (`full_name`, `age`, `gender`, `allergies`), active `Prescription` protocol, upcoming `Appointment` date/time, general Ayurvedic wellness knowledge base.
- **Outputs:** Personalized diet & lifestyle advice, treatment education, appointment guidance, medical disclaimers.

---

## 2. Expanded Privacy, Payload Minimization & Audit Table

| Feature | Data Sent to AI Provider | Why Data is Sent | Data NOT Sent (Explicitly Stripped) | Is Data Stored Externally? | Retention Policy | Audit Requirements |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. AI Disease Prediction** | Symptoms, vitals, age, gender, sanitized medical history | To generate differential diagnosis support | Name, email, phone, address, emergency contact, DB ObjectIds | **No.** Ephemeral prompt processing only. | Local DB record saved in `ai_predictions` collection until deleted by doctor/admin. | Query logged in `ai_audit_logs` with doctor ID, timestamp, and query parameters. |
| **2. AI Treatment Recommendation** | Confirmed condition, symptoms, age, past Rx treatment names | To generate Ayurvedic treatment & duration suggestions | PII, email, phone, address, payment history | **No.** Ephemeral prompt processing only. | Local DB record saved in `ai_recommendations` until prescription is finalized. | Logged in `ai_audit_logs` with doctor ID and recommendation payload. |
| **3. Outcome Analytics** | Anonymized statistical aggregates (e.g. "85% completion rate across 40 patients") | To generate textual summary insights from raw DB stats | Individual patient names, individual records, PII | **No.** Aggregated numbers only. | Stat snapshots cached locally on backend. | Access logged in server access logs. |
| **4. Smart Scheduling** | None (Uses 100% local deterministic backend rules) | N/A (Local conflict optimizer) | All patient data | **No.** | N/A | Logged in server access logs. |
| **5. AI Chatbot** | User question, active treatment name, age, allergies | To provide personalized Ayurvedic diet & therapy guidance | Direct PII, payment info, unassigned patient data | **No.** Ephemeral session processing. | Saved in local `chat_conversations` collection; user can delete history anytime. | Message count and session IDs logged. |
