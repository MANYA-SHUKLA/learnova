# Learnova Access Model

Fixed user provisioning and login workflow for the ERP + LMS core.

**There is no public faculty or student signup.** User creation is centralized under the Institution Admin (except the one-time institution onboarding registration).

---

## Roles present in Learnova

| Role | Who | Login | Dashboard |
| --- | --- | --- | --- |
| **Institution Admin** | University / college administrator (IT, LMS admin, Academic Office, ERP admin) | Email + password | Institution Dashboard |
| **Faculty** | Teachers (Assistant/Associate Professor, Professor, HOD, Lecturer, …) | Email + password | Faculty Dashboard |
| **Student** | Enrolled learners (B.Tech, M.Tech, MCA, MBA, PhD, …) | Email + password | Student Dashboard |

Future roles (`parent`, `teaching_assistant`, …) may exist in the RBAC matrix but are **not** provisioned in the current product workflow.

---

## Final user creation flow

```
Institution Registers (/register-institution)
  ↓
Institution + Institution Admin account created
  ↓
Institution Admin logs in → Institution Dashboard / Setup
  ↓
Creates Faculty (Faculty module) → login user provisioned → credentials issued
  ↓
Creates Students (Student module) → login user provisioned → credentials issued
  ↓
Faculty login → Faculty Dashboard
Student login → Student Dashboard
```

### 1. Institution Admin

- **Created by:** Institution Registration only (first account).
- **Can “sign up”:** Yes — once, via institution onboarding (`POST /api/v1/auth/register` / `/register-institution`).
- **Login:** Email + password on the shared `/login` page.
- **After login:** Institution Dashboard (or `/institution/setup` if profile incomplete).
- **Password:** Change password · Forgot password · Reset password.

### 2. Faculty

- **Created by:** Institution Admin in the Faculty module.
- **Can sign up:** **No.** Faculty never self-register.
- **Login:** Email + password on the shared `/login` page.
- **After login:** Faculty Dashboard.
- **Credentials:** Issued when the admin creates the faculty record (login user provisioned; default temp password until changed).
- **Password:** Faculty logs in → change password; may use forgot password.

### 3. Student

- **Created by:** Institution Admin in the Student module.
- **Can sign up:** **No.** Students never self-register.
- **Login:** Email + password on the shared `/login` page.
- **After login:** Student Dashboard.
- **Credentials:** Issued when the admin creates the student record (login user provisioned).
- **Password:** Student logs in → change password; may use forgot password.

---

## Login screen (single page)

Every role uses the **same** login page: `/login`

```
Email
Password
Login
```

Post-login redirect is automatic by role (`dashboardPathForRole` / `resolvePostLoginPath`):

| Role | Destination |
| --- | --- |
| Institution Admin | `/institution/dashboard` (or setup) |
| Faculty | `/faculty/dashboard` |
| Student | `/student/dashboard` |

---

## What does NOT exist

- ❌ Student signup
- ❌ Faculty signup
- ❌ Teacher registration (public)
- ❌ Public “Create Student Account” / “Create Faculty Account”

Admin **create** flows inside the authenticated Faculty/Student modules are intentional — those are not public signup.

---

## Access matrix

| Role | Created by | Can sign up | Login | Dashboard |
| --- | --- | --- | --- | --- |
| Institution Admin | Institution Registration | Yes (institution onboarding only) | Email + Password | Institution |
| Faculty | Institution Admin | No | Email + Password | Faculty |
| Student | Institution Admin | No | Email + Password | Student |

---

## Implementation map

| Concern | Location |
| --- | --- |
| Institution register | `auth.service.registerInstitution`, `/register-institution` |
| Shared login | `auth.service.login`, `/login` |
| Role redirect | `apps/frontend/src/lib/auth/redirects.ts` |
| Faculty login user | `provisionLoginUser({ role: 'faculty' })` on faculty create |
| Student login user | `provisionLoginUser({ role: 'student' })` on student create |
| Temp password default | `Learnova@ChangeMe1` (unless admin sets one) |
| Demo accounts | `seed:demo` → `faculty.demo@learnova.test` / `student.demo@learnova.test` |

---

## Related

- [Auth.md](./Auth.md)
- [Faculty.md](./Faculty.md)
- [Student.md](./Student.md)
- [Institution.md](./Institution.md)
