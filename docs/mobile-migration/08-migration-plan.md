# AyurSutra Mobile Migration & Implementation Plan

## 1. Overview & Migration Philosophy

This document outlines the step-by-step phased roadmap for hardening the existing AyurSutra Express backend and developing the cross-platform React Native / Expo mobile application.

**Strict Constraint:** In Phase 1 (Audit & Architecture), NO existing backend code, database collections, routes, or frontend files were modified. All execution steps below will take place ONLY after user approval.

---

## 2. Phased Roadmap

```
Phase 1: Audit & Architecture (COMPLETED)
  ├── Complete Codebase Audit & Endpoint Mapping
  └── Creation of /docs/mobile-migration/ Documentation Suite

Phase 2: Backend Hardening & API Refactoring (Pending Approval)
  ├── Security Patching (VULN-01 to VULN-07)
  ├── Scope Authorization Middleware (BOLA/IDOR Fixes)
  ├── Missing Endpoint Creation (/api/documents)
  └── API Validation & Automated Unit Tests

Phase 3: React Native / Expo Mobile App Setup (Pending Approval)
  ├── Expo Project Initialization with TypeScript & NativeWind
  ├── React Navigation Setup (Dynamic Stacks for 5 Roles)
  └── Hardware-Backed Secure Storage & Network Client (`authFetch`)

Phase 4: Role-Based Mobile UI Development (Pending Approval)
  ├── Patient Mobile Screens (Booking, Progress, Documents, Vitals)
  ├── Doctor Mobile Screens (Prescriptions, Patients, Slots, Notes)
  ├── Therapist Mobile Screens (Sessions, Session Logger, Notes)
  ├── Receptionist Mobile Screens (Walk-ins, Check-in, Billing)
  └── Admin Mobile Screens (User Directory, Analytics, Master Schedule)

Phase 5: Verification & Launch (Pending Approval)
  ├── End-to-End API Integration Testing
  ├── Cross-Platform Mobile Verification (iOS / Android)
  └── Final Delivery Walkthrough
```

---

## 3. Detailed Execution Phases

### Phase 2: Backend Hardening & Refactoring
- **Task 2.1: Fix Registration Role Escalation (`VULN-01`)**
  - Modify `authController.js`: Hardcode `role: 'patient'` in public `registerUser`.
  - Add admin-only route `POST /api/users/staff` for creating Doctor/Therapist/Receptionist accounts.
- **Task 2.2: Enforce Object-Level Authorization (`VULN-02`, `VULN-03`, `VULN-04`)**
  - Update `appointmentsController.js`: Auto-filter appointments by `req.user._id` if caller is a Patient, Doctor, or Therapist.
  - Update `appointmentRoutes.js`: Add authorization checks to `DELETE /:id`, `PUT /:id/status`, and `PUT /:id/pay`.
  - Update `prescriptionRoutes.js` and `noteRoutes.js`: Verify patient ownership before returning medical records.
- **Task 2.3: Implement Document Management Endpoint**
  - Create `models/document.js` schema (`patientId`, `name`, `type`, `fileData`, `createdAt`).
  - Create `controllers/documentController.js` and `routes/documentRoutes.js`.
  - Register `/api/documents` router in `routes/index.js`.

### Phase 3: Mobile App Scaffold Setup
- **Task 3.1: Initialize Expo Project**
  - Run `npx create-expo-app@latest mobile --template tabs` (or blank TypeScript).
  - Configure `expo-secure-store`, `react-navigation`, and `nativewind`.
- **Task 3.2: Native Network & Auth Store**
  - Implement `useAuthStore` using Zustand to track current user and JWT token loaded from SecureStore.
  - Implement native `authFetch` with auto-logout on 401 response.

### Phase 4: Mobile Screen Implementation
- **Task 4.1: Role Selection & Authentication Screens**
  - Build polished splash screen, role selector card grid, and login modal.
- **Task 4.2: Patient Mobile App Experience**
  - Implement bottom tabs: Home (Progress & Next Session), Book Appointment, Medical Vault, Profile.
- **Task 4.3: Doctor & Therapist Mobile App Experience**
  - Implement Patient Management list, Prescription Builder form, Slot Availability picker, and Session Logger.
- **Task 4.4: Receptionist & Admin Mobile App Experience**
  - Implement Walk-in Registration screen, Bill Payment settlement button, User Management controls, and Master Schedule.

### Phase 5: Verification & Testing Plan
- **Automated Verification:**
  - Verify Express API routes respond correctly via Postman / Automated Jest Supertest suite.
- **Manual Mobile Verification:**
  - Test login flows across all 5 roles on iOS Simulator and Android Emulator.
  - Confirm role-based tab rendering and permission boundaries.
