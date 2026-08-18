# 06 — Feature Integration & Proposed Modifications Specification (Revised)

## 1. Staged Implementation Order (Corrected)

Implementation will proceed strictly **one phase at a time** in the following order:

1. **Phase 1 — Outcome Analytics Dashboard**
2. **Phase 2 — Smart Appointment Scheduling with Conflict Optimization**
3. **Phase 3 — AI Chatbot with Personalized Diet and Therapy Guidance**
4. **Phase 4 — AI Treatment Recommendation**
5. **Phase 5 — AI Disease Prediction**

---

## 2. Detailed Audit of Proposed Modifications to Existing Files

Per strict baseline preservation rules, all new features are **100% additive**. The existing application architecture, authentication, navigation, and database schemas remain unchanged.

Below is the exhaustive list of existing files that require minimal additive extension:

### 1. `backend/routes/index.js`
- **Current Purpose:** Main Express router mounting `/auth`, `/users`, `/appointments`, `/prescriptions`, `/notes`, `/reports`, `/feedback`.
- **Exact Proposed Modification:** Add 3 isolated router mount lines:
  ```javascript
  router.use('/analytics', analyticsRoutes);
  router.use('/scheduling', schedulingRoutes);
  router.use('/ai', aiRoutes);
  ```
- **Why Modification is Necessary:** Required to expose the new isolated API namespaces to the mobile client.
- **Risk:** Extremely Low (Additive mount only; existing routes untouched).
- **Alternative Approach:** Mount directly in `server.js` (equivalent risk, less modular).

---

### 2. `mobile/app/admin/index.tsx` (Admin Dashboard)
- **Current Purpose:** Renders Admin system analytics, user counts, appointment metrics, and revenue stats.
- **Exact Proposed Modification:** Import and append `<OutcomeAnalyticsCard role="admin" />` at the bottom of the existing ScrollView.
- **Why Modification is Necessary:** Entry point for Admin to view Outcome Analytics.
- **Risk:** Low (Isolated component addition).
- **Alternative Approach:** Create a new tab, but adding a card to existing ScrollView preserves navigation structure.

---

### 3. `mobile/app/doctor/index.tsx` & `patients.tsx` (Doctor Dashboard & Patients)
- **Current Purpose:** Renders Doctor consultations, assigned patients, and patient health chart modal.
- **Exact Proposed Modification:**
  - On `index.tsx`: Append `<OutcomeAnalyticsCard role="doctor" />`.
  - On `patients.tsx` modal: Add two isolated action buttons: `"🤖 AI Clinical Support"` (triggers `ClinicalSupportModal` for predictions/recommendations) and `"💬 AI Consultation Assistant"`.
- **Why Modification is Necessary:** Provides Doctor access to clinical decision support & outcomes without changing existing patient charts.
- **Risk:** Low (Additive modal triggers).
- **Alternative Approach:** Dedicated AI screen in Doctor "More" menu.

---

### 4. `mobile/app/therapist/index.tsx` & `patients.tsx` (Therapist Home & Patients)
- **Current Purpose:** Renders Therapist session queue and care charts.
- **Exact Proposed Modification:**
  - On `index.tsx`: Append `<OutcomeAnalyticsCard role="therapist" />`.
  - On `patients.tsx`: Add `<TherapyCareGuidanceCard />`.
- **Why Modification is Necessary:** Entry point for Therapist session outcomes and therapy care guidance.
- **Risk:** Low (Additive component).
- **Alternative Approach:** Separate screen.

---

### 5. `mobile/app/receptionist/appointments.tsx` (Receptionist Appointments)
- **Current Purpose:** Renders master appointment schedule and status updaters.
- **Exact Proposed Modification:** Add `"⚡ Smart Slot Optimizer"` action button near the booking modal trigger to open `<SmartSchedulingModal />`.
- **Why Modification is Necessary:** Entry point for Receptionist to trigger intelligent scheduling recommendations.
- **Risk:** Low (Isolated modal trigger).
- **Alternative Approach:** Button inside existing booking modal.

---

### 6. `mobile/app/patient/index.tsx` & `report.tsx` (Patient Home & Reports)
- **Current Purpose:** Renders Patient Panchakarma banner, appointments, and report charts.
- **Exact Proposed Modification:**
  - On `index.tsx`: Add floating or action card `"🌿 AI AyurSutra Wellness Assistant"` (opens `<AIChatbotModal />`).
  - On `report.tsx`: Append `<OutcomeAnalyticsCard role="patient" />` for personal recovery timeline.
- **Why Modification is Necessary:** Entry point for Patient chatbot & recovery analytics.
- **Risk:** Low (Additive component).
- **Alternative Approach:** Dedicated tab for Chatbot.
