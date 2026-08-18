# 08 — Smart Appointment Scheduling & Conflict Optimization Specification

## 1. Existing Appointment Architecture & Fields

AyurSutra utilizes a single authoritative MongoDB model [`Appointment.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/appointment.js) with the following fields:
- `patientId`: Ref User (Required)
- `doctorId`: Ref User (Optional)
- `therapistId`: Ref User (Optional)
- `treatment`: String (Required, e.g. "Abhyanga Therapy", "Doctor Consultation")
- `appointment_date`: Date (Required)
- `appointment_time`: String (Required, e.g. "10:00 AM" or "10:00")
- `status`: Enum (`scheduled`, `completed`, `cancelled`, `in-progress`, `confirmed`)
- `cost`: Number
- `isPaid`: Boolean
- `blockedSlots`: Defined on [`User.js`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/backend/models/user.js) (`[{ date: Date, time: String }]`)

---

## 2. Deterministic Scheduling & Ranking Algorithm

### A. Working Hours & Time Grid Definition
- **Clinic Working Hours:** `08:00 AM` to `06:00 PM` (10-hour operating window).
- **Time Slot Increments:** 30-minute default grid (`08:00`, `08:30`, `09:00`, `09:30`, `10:00`, ..., `17:30`).
- **Default Treatment Duration:** 60 minutes (2 grid slots).

### B. Conflict Detection Logic (Pure Deterministic Rule Engine)
An requested slot `(targetStaffId, targetDate, startTime, durationMins)` has a **CONFLICT** if:
1. Staff member has a `blockedSlots` entry matching `targetDate` and overlapping `startTime` to `endTime`.
2. Staff member has an active `Appointment` (`status !== 'cancelled'`) on `targetDate` where:
   $$\text{ExistingStartTime} < \text{RequestedEndTime} \quad \text{AND} \quad \text{ExistingEndTime} > \text{RequestedStartTime}$$

### C. Deterministic Slot Ranking Formula
Each non-conflicting slot $S$ is scored deterministically using an explainable formula:
$$\text{Score}(S) = 100 - 5 \times \left| \frac{T_S - T_{\text{req}}}{15} \right| + \text{Bonus}_{\text{Compact}}$$
- **Base Score:** 100 points.
- **Proximity Penalty:** Deducts 5 points per 15-minute deviation from requested time $T_{\text{req}}$.
- **Compact Schedule Bonus:** $+20$ points if the slot directly abuts an existing appointment (minimizes staff idle gap).

---

## 3. Double-Booking Protection & Race-Condition Safeguards

1. **Client-Side Validation Alone is Insufficient:** Availability displayed on mobile screens is transient.
2. **Atomic Pre-Booking Re-Check:** Inside `POST /api/appointments` (and `POST /api/scheduling/recommendations`), the Express backend executes a **mandatory atomic collision check** against MongoDB before inserting the appointment record:
   ```javascript
   const existingConflict = await Appointment.findOne({
     $or: [
       { doctorId: staffId },
       { therapistId: staffId }
     ],
     appointment_date: targetDateObj,
     appointment_time: requestedTime,
     status: { $ne: 'cancelled' }
   });
   if (existingConflict) {
     return res.status(409).json({ message: 'Slot was just booked by another user. Please choose an alternative slot.' });
   }
   ```

---

## 4. Timezone & Date Representation Standard

To prevent JavaScript date parsing bugs across operating systems:
- Dates are passed as ISO `YYYY-MM-DD` strings (e.g. `"2026-08-14"`).
- Server converts `"2026-08-14"` into a UTC midnight Date range `[2026-08-14T00:00:00.000Z, 2026-08-14T23:59:59.999Z]` for Mongoose queries.
- Times are passed as 24-hour `"HH:mm"` strings (e.g. `"10:00"`, `"14:30"`) or 12-hour formatted strings (`"10:00 AM"`).

---

## 5. API Endpoints (`/api/scheduling`)

1. `POST /api/scheduling/check-conflicts`
   - **Access:** `protect` (`admin`, `doctor`, `therapist`, `receptionist`, `patient`)
   - **Payload:** `{ staffId: string, date: string, time: string, durationMins?: number }`
   - **Response:** `{ hasConflict: boolean, reason?: string }`

2. `POST /api/scheduling/recommendations`
   - **Access:** `protect` (All authenticated roles)
   - **Payload:** `{ staffId: string, preferredDate: string, preferredTime?: string, durationMins?: number }`
   - **Response:** `{ requestedSlotAvailable: boolean, recommendedSlots: [{ time: string, score: number, rationale: string }] }`
