# API Test Plan - BaoCom System
**Document ID:** BAOCOM-TEST-PLAN-001  
**Version:** 1.0  
**Date:** 2026-05-13  
**Author:** AI Assistant  
**Status:** Draft

---

## 1. Introduction

### 1.1 Purpose
This test plan defines the comprehensive testing strategy for the BaoCom Meal Registration API system. The system is a Next.js application with Prisma ORM and SQLite database, providing employee meal registration functionality with admin management capabilities.

### 1.2 Scope
- **16 API endpoints** across 7 functional modules
- **5 database models**: User, Meal, DailyMenu, Registration, Holiday
- **Test types**: Unit, Integration, System, Acceptance, Security, Performance, Regression, API Functional

### 1.3 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    BaoCom API                           │
├─────────────────────────────────────────────────────────┤
│  Auth Module    │  Users Module  │  Meals Module        │
│  - login       │  - list        │  - list              │
│  - logout      │  - get         │  - get               │
│  - me          │  - create      │  - create            │
│                │  - update      │  - update            │
│                │  - delete      │  - delete            │
├─────────────────────────────────────────────────────────┤
│  DailyMenus    │  Registrations│  Holidays             │
│  - list        │  - list       │  - list               │
│  - get         │  - create     │  - create             │
│  - create      │  - update     │  - update             │
│  - update      │  - delete     │  - delete             │
├─────────────────────────────────────────────────────────┤
│  Admin Module                                          │
│  - stats, reports                                      │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Test Types and Objectives

### 2.1 Test Type Matrix

| Test Type | Objective | Criteria |
|-----------|-----------|----------|
| **Unit Test** | Verify individual functions work correctly | All service/repository methods pass |
| **Integration Test** | Verify modules communicate correctly | Database operations succeed |
| **System Test** | Verify entire system workflow | End-to-end scenarios pass |
| **Acceptance Test** | Confirm business requirements met | User stories validated |
| **Security Test** | Verify auth/authz and input validation | No vulnerabilities |
| **Performance Test** | Verify response times under load | < 500ms average |
| **Regression Test** | Ensure changes don't break existing features | All prior tests pass |
| **API Functional Test** | Verify each endpoint functions correctly | All endpoints return expected status codes |

### 2.2 API-to-Test-Type Mapping

| API Endpoint | Unit | Int | Sys | Accept | Sec | Perf | Reg | API |
|--------------|------|-----|-----|--------|-----|------|-----|-----|
| **Auth** |
| POST /api/auth/login | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /api/auth/logout | ✓ | ✓ | ✓ | ✓ | ✓ | | | ✓ |
| GET /api/auth/me | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| **Users** |
| GET /api/users | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /api/users/[id] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| POST /api/users | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| PATCH /api/users/[id] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| DELETE /api/users/[id] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| **Meals** |
| GET /api/meals | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /api/meals/[id] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| POST /api/meals | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| PATCH /api/meals/[id] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| DELETE /api/meals/[id] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| **DailyMenus** |
| GET /api/daily-menus | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /api/daily-menus/[date] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| POST /api/daily-menus | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| PUT /api/daily-menus/[date] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| **Registrations** |
| GET /api/registrations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| POST /api/registrations | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| PATCH /api/registrations/[id] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| DELETE /api/registrations/[id] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| **Holidays** |
| GET /api/holidays | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| POST /api/holidays | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| PATCH /api/holidays/[id] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| DELETE /api/holidays/[id] | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| **Admin** |
| GET /api/admin/stats | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| GET /api/admin/reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 3. Test Environment

### 3.1 Prerequisites
- Node.js 18+ installed
- npm packages installed (`npm install`)
- SQLite database initialized with seed data
- Test user accounts available (admin, employee)

### 3.2 Test Data Requirements
- Minimum 3 test users (1 admin, 2 employees)
- Minimum 5 meals (main, vegetable, dessert types)
- Minimum 3 daily menus
- Minimum 10 registrations
- Minimum 2 holidays

### 3.3 Environment Configuration
```
NODE_ENV=test
DATABASE_URL=file:./dev.db
TEST_ADMIN_USER=admin
TEST_ADMIN_PASS=admin123
TEST_EMPLOYEE_USER=employee1
TEST_EMPLOYEE_PASS=employee123
```

---

## 4. Test Execution Schedule

### 4.1 Phase 1: Unit Testing (Priority: High)
- Test each service method independently
- Mock database interactions
- Verify business logic

### 4.2 Phase 2: API Functional Testing (Priority: High)
- Test each endpoint with valid/invalid inputs
- Verify HTTP status codes
- Verify response format

### 4.3 Phase 3: Integration Testing (Priority: High)
- Test database operations
- Test controller-service-repository flow

### 4.4 Phase 4: Security Testing (Priority: Critical)
- Test authentication bypass attempts
- Test authorization (role-based access)
- Test input validation

### 4.5 Phase 5: Acceptance Testing (Priority: Medium)
- Test user workflows (registration, admin reporting)
- Verify business rules

### 4.6 Phase 6: Performance Testing (Priority: Low)
- Load testing on list endpoints
- Response time measurement

---

## 5. Success Criteria

### 5.1 Test Completion Criteria
- **100%** of planned test cases executed
- **0** critical security vulnerabilities found
- **90%+** test case pass rate
- All high-priority defects resolved

### 5.2 Exit Criteria
- Unit tests: 100% pass
- Integration tests: 100% pass
- API tests: 95%+ pass
- Security tests: 0 critical issues
- Performance: < 500ms average response

---

## 6. Defect Reporting

### 6.1 Severity Levels
| Level | Description | Examples |
|-------|-------------|----------|
| **Critical** | System unusable | Auth bypass, data loss |
| **High** | Major feature broken | Can't register meals |
| **Medium** | Feature impaired | Wrong date format |
| **Low** | Minor issue | UI text error |

### 6.2 Defect Report Template
```markdown
| ID | Severity | Description | API | Steps to Reproduce | Expected | Actual | Status |
|----|----------|-------------|-----|-------------------|----------|--------|--------|
```

---

## 7. Test Specifications Index

Detailed test specifications for each API module:

| Module | File | Test Cases |
|--------|------|------------|
| Auth | `test-specs/auth-api-tests.md` | TC-AUTH-001 to TC-AUTH-008 |
| Users | `test-specs/users-api-tests.md` | TC-USER-001 to TC-USER-015 |
| Meals | `test-specs/meals-api-tests.md` | TC-MEAL-001 to TC-MEAL-012 |
| DailyMenus | `test-specs/daily-menus-api-tests.md` | TC-DM-001 to TC-DM-010 |
| Registrations | `test-specs/registrations-api-tests.md` | TC-REG-001 to TC-REG-012 |
| Holidays | `test-specs/holidays-api-tests.md` | TC-HOL-001 to TC-HOL-010 |
| Admin | `test-specs/admin-api-tests.md` | TC-ADMIN-001 to TC-ADMIN-008 |

---

**Document Approval:**
- [ ] Review by Project Lead
- [ ] Review by QA Lead
- [ ] Final Approval

**Change History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-13 | AI Assistant | Initial version |