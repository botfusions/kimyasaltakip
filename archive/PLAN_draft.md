# 📅 Implementation Plan: Digital Recipe & Chemical Production Monitoring System

> **Status:** Draft
> **Version:** 1.0
> **Based on:** PRD v1.0, Architecture v1.0, Database v1.0

---

## 🏗️ Phase 1: Foundation Setup (Week 1)
**Goal:** Establish the technical groundwork for Frontend, Backend, and Automation.

### 1.1 Backend Initialization (Supabase)
- [ ] Initialize Supabase project
- [ ] **Database Schema:** Execute `DATABASE_SCHEMA.md` SQL scripts
  - [ ] Create enumerations (User Roles, Statuses, Units)
  - [ ] Create core tables (`users`, `products`, `materials`, `recipes`)
  - [ ] Create operational tables (`stock`, `production_logs`)
  - [ ] Create indexes for performance
- [ ] **Security (RLS):** Apply RLS policies as defined in `ARCHITECTURE.md`
  - [ ] Admin Full Access policies
  - [ ] Role-based Read/Write policies
- [ ] **Auth:** Configure Supabase Auth (Email/Password) & User Roles trigger

### 1.2 Frontend Initialization (Next.js)
- [ ] Initialize Next.js (App Router, TypeScript, Tailwind CSS)
- [ ] Setup Folder Structure (Feature-based: `@/features/recipes`, `@/features/stock`)
- [ ] **Design System:** Implement core UI components (Button, Input, Card, Table)
- [ ] **Layouts:** Create Role-based Layouts (Admin, Lab, Production, Warehouse)
- [ ] **State Management:** Setup Zustand for global state (User, Settings)
- [ ] **API Layer:** Create Type-safe Supabase Client & Hooks

### 1.3 Automation Setup (n8n)
- [ ] Configure n8n environment (Self-hosted or Cloud)
- [ ] Setup Webhook endpoints structure
- [ ] Connect n8n to Supabase (PostgreSQL node) and SMTP

---

## 🧩 Phase 2: Core Modules Implementation (Week 2-3)
**Goal:** Enable Master Data management and basic Recipe flows.

### 2.1 User & Settings Module
- [ ] **Admin:** User Management (Create, Edit, Roles)
- [ ] **Settings:** System Configuration (Thresholds, Alerts)
- [ ] **Profile:** User Profile & Password Management

### 2.2 Master Data Module
- [ ] **Materials:** CRUD operations, Safety Info, Critical Levels
- [ ] **Products:** Product Definitions (SKU, Colors)
- [ ] **Usage Types:** Define Usage Rules & Constraints

### 2.3 Recipe Management Module (Critical)
- [ ] **Recipe Editor:** Dynamic Form for Materials & Ratios
- [ ] **Versioning:** Implementation of Version Control logic
- [ ] **Constraint Engine (Backend/n8n):**
  - [ ] Validation Logic (Required/Forbidden materials)
  - [ ] Ratio Checks
- [ ] **Approval Flow:** Request Approval -> Review -> Approve/Reject

---

## 🏭 Phase 3: Operational Modules (Week 4-5)
**Goal:** Implement the "Live" production tracking and stock management.

### 3.1 Stock Management Module
- [ ] **Stock View:** Real-time quantity monitoring
- [ ] **Movements:** In/Out/Adjustment operations with logging
- [ ] **Alerts:** Low stock visual indicators & Email triggers

### 3.2 Production Module (Critical)
- [ ] **Production Start:**
  - [ ] Recipe Selection & Quantity Input
  - [ ] Stock Availability Check (Pre-calculation)
  - [ ] "Start" Action -> Deduct Stock -> Create Log
- [ ] **Daily Dashboard:** Operator view for active/completed jobs
- [ ] **Logging:** Detailed Production Logs & Material Usage variance

### 3.3 Reporting & Dashboards
- [ ] **KPI Dashboard:** Role-specific widgets (Daily Production, Alerts)
- [ ] **Reports:** Consumption Report, Production History (Export to Excel)

---

## 🔗 Phase 4: Integration & Verification (Week 6)
**Goal:** Connect workflows and ensure system reliability.

### 4.1 n8n Workflows
- [ ] **WF1: Recipe Validation:** Connect Webhook -> Check Rules -> Respond
- [ ] **WF2: Stock Deduction:** Connect Webhook -> Transaction -> Update Stock
- [ ] **WF3: Alerts:** Scheduled check -> Email/Telegram dispatch

### 4.2 Quality Assurance
- [ ] **E2E Testing:** Critical Flows (Create Recipe -> Approve -> Produce)
- [ ] **Security Audit:** Verify RLS allows/denies correct access per role
- [ ] **Performance:** Load testing for multiple concurrent operators

---

## ✅ Acceptance Criteria
- [ ] All "High Priority" User Stories from PRD completed.
- [ ] ISO 9001 Traceability requirements met (Audit Logs active).
- [ ] System handles concurrent Production Start requests correctly.
- [ ] RLS prevents unauthorized data access.
