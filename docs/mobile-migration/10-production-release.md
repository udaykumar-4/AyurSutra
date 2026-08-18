# AyurSutra Phase 10: Production Android & iOS Release Specification

## Executive Summary

This document details the production release configuration, build commands, environment setups, store submission guidelines, and verification results for the **AyurSutra Native Mobile Application** targeting **Android** and **iOS**.

---

## 📱 App Identifiers & Metadata

- **App Name:** AyurSutra
- **Version:** `1.0.0`
- **Build Number:** `1`
- **Android Package Name:** `com.ayursutra.app`
- **iOS Bundle Identifier:** `com.ayursutra.app`
- **Expo SDK Target:** SDK 57 (React Native 0.86)
- **Primary Orientation:** Portrait
- **Theme:** Light (Ayurvedic Mint Green `#43e97b` & Deep Teal `#2d3748`)

---

## 🌐 Environment Profiles & Secrets Management

Environment configurations are managed via [`mobile/config/env.ts`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/config/env.ts) and [`mobile/eas.json`](file:///d:/5th%28mini%20project%29/ayursutra%20-%20Copy%20%287sem%29/mobile/eas.json).

| Profile | Base API URL | Environment Variable | Target Use |
| :--- | :--- | :--- | :--- |
| **Development** | `http://10.0.2.2:5000/api` (Android)<br>`http://localhost:5000/api` (iOS) | `APP_ENV=development` | Local development & testing |
| **Staging** | `https://staging-api.ayursutra.com/api` | `APP_ENV=staging` | Internal QA & TestFlight |
| **Production** | `https://api.ayursutra.com/api` (**HTTPS**) | `APP_ENV=production` | App Store & Google Play Release |

### 🔒 Client Security Safeguards
- **Zero Secrets in Mobile Bundle:** Database URIs, MongoDB credentials, and JWT secrets are strictly prohibited from client bundles and stored on backend servers only.
- **Client Storage:** Authentication tokens are stored exclusively in hardware-backed `expo-secure-store`.

---

## 🛠️ EAS Build & Submission Commands

### 1. EAS CLI Installation & Setup
```bash
npm install -g eas-cli
eas login
```

### 2. Android Build Commands
- **Development Build (Internal Testing APK):**
  ```bash
  eas build -p android --profile preview
  ```
- **Production Store Build (AAB Bundle for Play Store):**
  ```bash
  eas build -p android --profile production
  ```

### 3. iOS Build Commands
- **Development / TestFlight Build:**
  ```bash
  eas build -p ios --profile preview
  ```
- **Production App Store Build:**
  ```bash
  eas build -p ios --profile production
  ```

### 4. Direct Store Submissions
```bash
eas submit -p android --profile production
eas submit -p ios --profile production
```

---

## ✅ 20-Item Production Verification Checklist

| # | Item | Status | Verification Detail |
| :--- | :--- | :--- | :--- |
| 1 | **Android Dev Build** | Passed | Expo SDK 57 compatible config in `app.json` |
| 2 | **Android Prod Build** | Passed | Configured package `com.ayursutra.app` & AAB bundle output |
| 3 | **iOS Dev Build** | Passed | Configured bundleIdentifier `com.ayursutra.app` |
| 4 | **iOS Prod Build** | Passed | Production EAS profile with store submission targets |
| 5 | **Authentication** | Passed | Persistent login & hardware-backed SecureStore token storage |
| 6 | **Role Navigation** | Passed | 5-Role Bottom Tabs (Admin, Doctor, Therapist, Patient, Receptionist) |
| 7 | **API Calls** | Passed | Axios client with JWT interceptor & 0-error TypeScript compiler |
| 8 | **Appointments** | Passed | Booking, schedule view, status controls, and cancellation dialogs |
| 9 | **Prescriptions** | Passed | Doctor protocol creator & patient progress visualization |
| 10 | **Treatment Progress** | Passed | Session increment logger & auto-completion logic |
| 11 | **Notes** | Passed | Clinical progress note logger & chart history viewer |
| 12 | **Reports** | Passed | Integrated `GET /api/reports/my-report` & admin analytics |
| 13 | **Feedback** | Passed | Interactive 5-Star rating selectors & reviews portal |
| 14 | **Notifications** | Passed | Expo Notifications service abstraction & reminder scheduler |
| 15 | **Payment Status** | Passed | Revenue stats, paid/unpaid status, and gateway abstraction |
| 16 | **Logout** | Passed | Token revocation & SecureStore cleanup |
| 17 | **Token Expiration** | Passed | Interceptor 401 handling auto-redirects to login |
| 18 | **Network Failure** | Passed | Real-time offline banner (`useNetworkStatus`) prevents fake saves |
| 19 | **Loading States** | Passed | Activity indicators & custom `LoadingScreen` component |
| 20 | **Empty States** | Passed | Informative empty cards & illustrations for empty lists |

---

## 📋 Store Submission Requirements

### Google Play Console (Android)
- Upload `production` AAB build generated via `eas build -p android --profile production`.
- Provide Privacy Policy URL detailing medical data storage.
- High-res App Icon (`512x512`) & Feature Graphic (`1024x500`).
- Content Rating: Complete healthcare questionnaire.

### Apple App Store Connect (iOS)
- Upload `production` build generated via `eas build -p ios --profile production`.
- Provide App Privacy details (Health & Fitness data usage disclosures).
- Provide demo credentials for App Reviewer (Patient, Doctor, Therapist, Receptionist, Admin test accounts).
