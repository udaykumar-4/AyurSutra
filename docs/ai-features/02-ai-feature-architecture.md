# 02 — AyurSutra AI & Analytics Architecture (Revised)

## 1. Core Architectural Overview

New AI and analytics capabilities follow a strict **decoupled, server-side service architecture**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           React Native Mobile App                       │
│    (Admin, Doctor, Therapist, Receptionist, Patient Tab Navigation)     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │  Authenticated HTTPS REST API
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Express.js Backend API                         │
│       (/api/analytics/*, /api/scheduling/*, /api/ai/* Routes)          │
└──────────┬─────────────────────────┬─────────────────────────┬──────────┘
           │                         │                         │
           ▼                         ▼                         ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│ Outcome Analytics  │    │  Smart Scheduling  │    │   AI Provider      │
│   Engine           │    │   Optimizer        │    │   Abstraction      │
└──────────┬─────────┘    └──────────┬─────────┘    └──────────┬─────────┘
           │                         │                         │
           │  Deterministic          │  Deterministic          │
           │  Statistical Rules      │  Conflict Rules         ▼
           │                         │              ┌────────────────────┐
           │                         │              │ External LLM / ML  │
           │                         │              │   Service (Gemini) │
           │                         │              └────────────────────┘
           ▼                         ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            MongoDB Database                             │
│   Existing Collections + New Isolated AI & Analytics Collections        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Server-Side Security & Key Isolation

1. **Zero Client-Side Secrets:** Mobile applications NEVER contain API keys, LLM service tokens, or MongoDB credentials.
2. **Server-Side Proxy:** The mobile client communicates exclusively with the Express backend (`/api/ai/*`). The backend injects API keys from `process.env.GEMINI_API_KEY` before querying AI models.
3. **Payload Minimization:** Before sending data to external AI models, the backend strips PII and minimizes clinical payloads to only what is strictly required for the specific task.

---

## 3. Revised AI Provider Abstraction & Fallback Principles

### A. Provider Interface
All AI requests pass through an extensible provider interface (`AIProvider` abstraction):
- `DiseasePredictionProvider`
- `TreatmentRecommendationProvider`
- `ChatbotProvider`
- `AnalyticsInsightProvider`

### B. Strictly Non-Fabricating Fallback Policy
- **No Pseudo-Diagnoses / Pseudo-Recommendations:** We explicitly **reject** using rule-based fallbacks to generate pseudo-diagnoses or fake treatment suggestions.
- **Disease Prediction & Treatment Recommendation:** If the external AI service is unavailable, offline, or times out, the system returns a clear, explicit `service_unavailable` state (`{ success: false, status: 'service_unavailable', message: 'AI Clinical Decision Support is currently offline.' }`).
- **Workflow Continuity:** Normal clinical workflows (prescription creation, consultation note creation, manual appointment booking) continue working completely unhindered.
- **Allowed Uses of Rule Engines:** Rule-based logic is restricted strictly to **deterministic, non-clinical functions**:
  1. Appointment double-booking conflict detection.
  2. Slot availability filtering & provider schedule gap ranking.
  3. Non-clinical data validation & authorization checks.

---

## 4. Rollback & Fail-Safe Strategy

- **Graceful Error Handling:** If an AI endpoint encounters a runtime error or API failure, the Express backend returns a clean JSON error response without crashing.
- **Non-Blocking Mobile UI:** Mobile UI components render isolated error banners or loading fallbacks. No core tab, form, or schedule screen will freeze or block due to an AI failure.
- **Feature Isolation:** Disabling or removing AI route middleware leaves baseline booking, prescription, and user management fully intact.
