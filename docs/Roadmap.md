# Learnova Roadmap

Phased delivery of the enterprise AI learning platform. Each step builds on a stable core — do not start the next domain until the previous step’s definition of done is met.

---

## Completed

| Step | Scope | State |
| --- | --- | --- |
| 1 | Foundation (monorepo, packages, API shell, theme, docs) | ✅ Complete |
| 2 | Infrastructure (Mongo, Redis, BullMQ, cache, mail, storage, events, health) | ✅ Complete |
| 3 | Authentication & Authorization | ✅ Complete |
| 4 | Institution & Academic Structure | ✅ Complete |
| 5 | Faculty Management | ✅ Complete |
| 6 | Student Management | ✅ Complete |

Together, Steps 1–6 form the **ERP people & structure core**: institution hierarchy, faculty, students, auth, permissions, and audit.

### Canonical ERP spine

```
Institution → Campus → School → Department → Program
  → Academic Year → Semester → Section → Batch
  → Faculty → Students
```

---

## Step 6.5 — System Integration & Demo *(recommended before Courses)*

**Status:** 🔲 Pending  
**Goal:** Prove the ERP core is stable end-to-end before LMS features (Courses, Enrollments, Lessons).

This checkpoint reduces the chance of discovering structural issues after several more modules have been built.

### Verify relationships (ERP spine)

Walk the chain top-down and confirm every link holds in API + UI:

```
Institution
  ↓
Campus
  ↓
School
  ↓
Department
  ↓
Program
  ↓
Academic Year
  ↓
Semester
  ↓
Section
  ↓
Batch
  ↓
Faculty
  ↓
Students
```

- [ ] Institution → Campus → School → Department → Program
- [ ] Academic Year → Semester → Section → Batch
- [ ] Faculty linked under the hierarchy (campus / school / department / programs)
- [ ] Students linked through campus → … → batch (+ year / semester / section)
- [ ] Soft delete / archive / restore behave correctly across modules

### Role-based logins

- [ ] **Institution Admin** — full institution, faculty, and student management
- [ ] **Faculty** — scoped student visibility (assigned departments); own profile
- [ ] **Student** — own profile only (`/student/profile`); no admin directory access

### Search, filters, import / export

- [ ] Faculty & Student list search (name, IDs, email)
- [ ] Filters (status, department, program, section, batch, etc.)
- [ ] Pagination & sorting
- [ ] CSV import preview + commit + rollback on failure
- [ ] Export (CSV / Excel / PDF) + audit of export events

### Permissions & audit

- [ ] Re-seed auth permissions so roles include `faculty:*` and `student:*`
- [ ] `PermissionGate` / API middleware deny unauthorized actions
- [ ] Audit trails for create / update / archive / restore / import / export / status change
- [ ] Domain events published for faculty & student lifecycle

### Responsive UI

- [ ] Marketing, auth, institution, faculty, and student surfaces on desktop / tablet / mobile
- [ ] Dark mode across ERP modules
- [ ] Empty, loading (skeletons), and error states with retry

### Demo script (suggested)

1. Log in as Institution Admin → finish institution setup if needed  
2. Create / confirm academic hierarchy (campus → … → batch)  
3. Add or import faculty → open a faculty profile  
4. Add or import students → confirm academic assignments  
5. Search / filter / bulk action / export on both directories  
6. Log in as Faculty → confirm scoped student list  
7. Log in as Student → confirm own profile only  
8. Spot-check audit logs for recent actions  

### Exit criteria

Step 6.5 is done when the checklist above is signed off and a short demo can be run without blockers. **Do not start Courses until this checkpoint passes.**

---

## Upcoming (LMS & beyond)

| Step | Scope | State |
| --- | --- | --- |
| 7 | Courses | 🔒 Blocked on Step 6.5 |
| 8 | Enrollments | Planned |
| 9 | Lessons / content | Planned |
| 10 | Practice Labs / Coding | Planned |
| 11 | Projects / Ideation | Planned |
| 12 | Examinations | Planned |
| 13 | Attendance / Grades | Planned |
| 14 | Certificates | Planned |
| 15 | Analytics & Notifications | Planned |
| 16 | AI features | Planned |

Exact ordering of Steps 8+ may shift; the hard rule is: **ERP core (1–6) + Integration Demo (6.5) before LMS Course Management.**

---

## Related docs

- [Institution](./Institution.md) · [Academic Structure](./AcademicStructure.md)
- [Faculty](./Faculty.md) · [Student](./Student.md)
- [Auth](./Auth.md) · [Architecture](./Architecture.md)
