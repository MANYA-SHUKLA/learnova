# Learnova Roadmap

Phased delivery of the enterprise AI learning platform. Each step builds on a stable core — do not start the next domain until the previous step’s definition of done is met.

---

## Status

| Step | Scope | State |
| --- | --- | --- |
| 1 | Foundation | ✅ Complete |
| 2 | Infrastructure | ✅ Complete |
| 3 | Authentication | ✅ Complete |
| 4 | Institution & Academic Structure | ✅ Complete |
| 5 | Faculty Management | ✅ Complete |
| 6 | Student Management | ✅ Complete |
| **6.5** | **System Integration & Demo** | ✅ Complete |
| **7** | **Course Management (catalog)** | ✅ Complete |
| **7.5** | **Course Builder & Content Management** | ✅ Complete |
| **8** | **Enrollments** | ✅ Complete |
| **8.25** | **Enrollment Integration Checkpoint** | ✅ Complete |
| **8.5** | **Progress Tracking** | ✅ Complete |

**Hard rule:** Course is a **container**. Step 7 ships metadata, ownership, publishing, and academic mapping only. Do **not** fold lessons, files, quizzes, or labs into Step 7.

**Hard rule:** Progress Tracking (8.5) is **complete** (DoD met). Practice Labs (Step **9**) is next and must **not** start until Progress DoD is met — now met. Enrollments remain the source of truth for each learner’s journey.

| Item often called “rest of Step 7” | Actual home |
| --- | --- |
| Course builder UI | **7.5** Content Builder |
| Modules / lessons CRUD UI | **7.5** Content Builder |
| Progress tracking | **8.5** ✅ |
| Enrollments | **8** |
| Enrollment integration | **8.25** |
| Richer search / filters | Catalog polish on **7** (optional) or content search in **7.5** |
| Import / export | **7** catalog ✅ shipped; content import/export in **7.5** |
| Analytics | **14** (platform) + course widgets deepen after enrollments |

---

## Canonical ERP spine

Everything in Steps 1–6 should already be connected. Step 6.5 verifies the spine end-to-end.

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

---

## Step 6.5 — System Integration & Demo

**Status:** ✅ Complete  
**Goal:** Prove the ERP core is stable before starting LMS (Courses).

### Authentication

- [ ] ✅ Institution Login
- [ ] ✅ Faculty Login
- [ ] ✅ Student Login

### Permissions

```
Institution Admin
  ↓
Faculty
  ↓
Student
```

- [ ] Institution Admin — full institution / faculty / student management
- [ ] Faculty — scoped access (own profile, assigned-department students)
- [ ] Student — own profile only

### Search

- [ ] Faculty Search
- [ ] Student Search
- [ ] Department Search
- [ ] Program Search

### Bulk operations

- [ ] Faculty Import
- [ ] Faculty Export
- [ ] Student Import
- [ ] Student Export

### Dashboard

- [ ] Statistics
- [ ] Charts
- [ ] Cards
- [ ] Tables

### Experience

- [ ] Responsive (desktop / tablet / mobile)
- [ ] Dark Mode across ERP modules

### Audit — everything logged

- [ ] Faculty Created
- [ ] Student Created
- [ ] Login
- [ ] Exports
- [ ] Imports
- [ ] Updates

### Exit criteria

Step 6.5 is done when the checklist above is signed off and a short demo runs without blockers. **Do not start Step 7 until this checkpoint passes.**

### Suggested demo script

1. Log in as Institution Admin → confirm hierarchy (campus → … → batch)  
2. Import / create faculty → export → confirm audit  
3. Import / create students → search / filter → export → confirm audit  
4. Log in as Faculty → scoped student list  
5. Log in as Student → own profile only  
6. Toggle dark mode · check responsive layouts · spot-check dashboard stats/charts/tables  

---

## After Step 6.5 — LMS begins

---

## Step 7 — Course Management

**Status:** ✅ Complete (catalog / metadata — no lessons yet)  
**Scale:** Enterprise LMS course catalog — CRUD, lifecycle, assignments, import/export, dashboard. Lesson builder is a later step.

### Shipped in Step 7

- Course model + repository + service + controller + APIs
- Search, filters, sorting, pagination, bulk ops
- Publish / unpublish / archive / restore / duplicate
- Faculty / program / semester assignment
- CSV import + CSV/Excel/PDF export
- Thumbnail upload
- Dashboard + list + detail + create/edit + import/export UI
- Permissions, audit, domain events, validation, seed (≥30), tests, docs

### Deferred (do not start yet — not incomplete Step 7)

These are **next steps**, not open Step 7 work:

| Next | Scope |
| --- | --- |
| **7.5** | Course builder UI · modules/lessons CRUD · content import/export |
| **8** | Enrollments (approve / auto / waitlist / deadline) |
| **8.25** | Enrollment integration checkpoint |
| **8.5** | Progress tracking ✅ |
| **14** | Richer analytics (completion, enrollments, faculty load) |

```
Modules → Lessons → Topics → Resources → Assignments → Labs → Projects → Quizzes → Exams → Certificates
```

Optional catalog polish (still container-only): richer multi-filter UI, saved views, enrollment-count sort once enrollments exist.
### Course hierarchy (future)

```
Course
  ↓
Modules
  ↓
Lessons
  ↓
Topics
  ↓
Resources
  ↓
Assignments
  ↓
Practice Labs
  ↓
Projects
  ↓
Quizzes
  ↓
Exams
  ↓
Certificates
```

### Course database (enterprise fields)

| Area | Fields |
| --- | --- |
| Identity | `id`, `courseCode`, `title`, `slug`, `description`, `thumbnail`, `banner` |
| Classification | `category`, `language`, `tags`, `difficulty` |
| Academic links | `department`, `programIds`, `semesterIds`, `credits`, `estimatedHours` |
| People | `facultyIds`, `coordinatorId` |
| Pedagogy | `prerequisites`, `outcomes`, `requirements`, `learningObjectives`, `skills` |
| Access | `visibility`, `status`, `enrollmentMode`, `maxStudents`, `enrollmentDeadline`, `waitlistEnabled` |
| Features | `certificateEnabled`, `discussionEnabled` |
| Lifecycle | `version`, `publishDate`, `archiveDate`, `createdBy`, `updatedBy`, timestamps |

### Course builder *(later)*

```
Module → Lesson → Content
```

**Content types:** Video · PDF · Markdown · HTML · Image · Audio · External Link · Embed · Code Block · Download · Presentation

### Student progress (per lesson) *(Step 8.5 ✅)*

Started · Completed · Watch % · Reading % · Time · Bookmarks · Notes · Last Position — see [Progress.md](./Progress.md)

### Role features

| Role | Capabilities |
| --- | --- |
| **Faculty** | Create · Edit · Duplicate · Archive · Publish · Assign Faculty · View Analytics (catalog) |
| **Student** | Read enrolled courses (enrollment module later) |
| **Institution Admin** | Full catalog management · Import · Export · Analytics |

### Permissions

| Role | Access |
| --- | --- |
| Institution | Everything |
| Faculty | Own / assigned courses |
| Student | Enrolled courses (read) |

### Search & filters

**Search:** Title · Code · Faculty · Department · Program · Semester · Tags  

**Filters:** Published · Draft · Archived · Department · Credits · Difficulty · Faculty · Language

### Course dashboard

Total Courses · Published · Draft · Archived · Scheduled · Faculty · Programs · Departments · Average Duration · Credits · Recent Activity

### AI *(later — not in Step 7)*

Generate Outline · Lessons · Quiz · Assignment · Lab · Project

### Documentation

- `Course.md`
- `CourseAPI.md`
- `CoursePermissions.md`
- `CourseImportExport.md`
- `CourseDashboard.md`
- `CourseBuilder.md` · `Progress.md` / `CourseProgress.md` — shipped in **7.5** / **8.5**

### Testing (Step 7 DoD)

CRUD · Permissions · Publishing · Archive · Duplicate · Search · Filters · Assignments · Import · Export

---

## Step 8.25 — Enrollment Integration Checkpoint

**Status:** ✅ Complete  
**Goal:** Prove enrollment rules, roles, dashboards, and audit/events are stable. Enrollments become the source of truth for Step **8.5** learner journeys.

**Checkpoint verified** via seed stack (`seed:auth`, `seed:enrollments`) and enrollment APIs — rules, role flows, dashboard counts, and audit/events stable before Progress was built.

**Hard rule (historical):** Do not start Progress Tracking until this checklist passes — **passed**.

### Course enrollment rules

Verify each course `enrollmentMode` + capacity settings:

| Mode / rule | Expected behavior |
| --- | --- |
| **Open** | Self-enroll creates an active enrollment |
| **Approval** | Self-enroll creates pending → faculty/admin approve or reject |
| **Invite only** | Self-enroll blocked unless invite path |
| **Closed** | Self-enroll rejected |
| **Waitlist** | At `maxStudents` with `waitlistEnabled` → join waitlist; withdraw frees a seat → auto-promote |
| **Deadline** | Past `enrollmentDeadline` → enroll rejected |

### Role-based flows

| Role | Verify |
| --- | --- |
| **Institution Admin** | Full directory · manual enroll · bulk · import/export · approve/reject · withdraw/complete |
| **Faculty** | Only assigned/coordinated courses · pending queue · approve/reject |
| **Student** | Own enrollments only · self-enroll · withdraw before deadline · waitlist join/leave |

### Dashboards & counts

After enrollments, approvals, withdrawals, and completions:

- [ ] Institution enrollment stats match list totals (pending / active / completed / withdrawn / waitlisted)
- [ ] Faculty pending count matches actionable requests
- [ ] Student “my enrollments” reflects status changes immediately
- [ ] Course capacity / waitlist position stays consistent after promote

### Audit & domain events

For every lifecycle action, confirm audit log + domain event:

| Action | Expect |
| --- | --- |
| Create / self-enroll | `enrollment.created` (+ `course.enrolled` when active) |
| Approve | `enrollment.approved` (+ `course.enrolled`) |
| Reject | `enrollment.rejected` |
| Withdraw | `enrollment.withdrawn` (+ waitlist promote if applicable) |
| Complete | `enrollment.completed` |
| Import / export | `enrollment.imported` / `enrollment.exported` |

### Demo checklist (manual)

1. Seed auth + enrollments (`seed:auth`, `seed:enrollments`)
2. Log in as admin · faculty · student demo users
3. Walk open / approval / closed / waitlist courses end-to-end
4. Spot-check audit timeline on enrollment detail
5. Confirm no progress/gradebook UI was introduced (out of scope)

### Exit criteria

✓ Rules behave correctly · ✓ Roles scoped correctly · ✓ Dashboards consistent · ✓ Audit + events present  

**Passed** — proceeded to **Step 8.5 — Progress Tracking**.

---

## Step 8.5 — Progress Tracking

**Status:** ✅ Complete  
**Goal:** Track enrolled learners through published course content with rollup, resume, bookmarks/notes, activity, and role dashboards.

### Shipped

- Course / module / lesson / resource progress models + rollup
- Open · update · complete lessons · resume position · learning sessions
- Bookmarks · lesson notes (+ export) · learning activity feed
- Student / faculty / institution dashboards · stats · search
- Permissions (`progress:read|write|manage`), audit, domain events, seed, tests, docs

### Out of scope (later)

Practice labs · projects · assignments · quizzes · exams · gradebook · attendance · certificates · AI

### Documentation

- `Progress.md`
- `CourseProgress.md`
- `LessonProgress.md`
- `Bookmarks.md`
- `LearningActivity.md`

### Exit criteria (DoD — met)

✓ Enrollment-gated writes · ✓ Published-content rollup · ✓ Permissions + scoping · ✓ Audit/events · ✓ Dashboards · ✓ Seed/tests/docs  

**Hard rule:** Progress DoD is met. Do **not** start Practice Labs (Step **9**) until this DoD is met — **now met**.

---

## Later LMS & platform steps

| Step | Scope | State |
| --- | --- | --- |
| **7.5** | Course Content Builder (modules / lessons / resources) | ✅ Complete |
| **8** | Enrollments | ✅ Complete |
| **8.25** | Enrollment Integration Checkpoint | ✅ Complete |
| **8.5** | Progress tracking | ✅ Complete |
| 9 | Practice Labs / Coding | Planned |
| 10 | Projects / Ideation | Planned |
| 11 | Examinations | Planned |
| 12 | Attendance / Grades | Planned |
| 13 | Certificates (platform-wide) | Planned |
| 14 | Analytics & Notifications | Planned |
| 15 | AI content generation | Planned |

**Boundary:** Keep Course Management focused on metadata, ownership, publishing, and academic mapping. Build contents (modules, lessons, assessments, labs, etc.) in subsequent steps so the codebase stays clean as the platform grows.

**Boundary:** Progress (8.5) DoD met — Practice Labs (9) is next; do not start labs until Progress DoD is met (now met).

---

## Related docs

- [Institution](./Institution.md) · [Academic Structure](./AcademicStructure.md)
- [Faculty](./Faculty.md) · [Student](./Student.md) · [Course](./Course.md)
- [Enrollment](./Enrollment.md) · [EnrollmentWorkflow](./EnrollmentWorkflow.md)
- [Progress](./Progress.md) · [CourseProgress](./CourseProgress.md) · [LessonProgress](./LessonProgress.md)
- [Bookmarks](./Bookmarks.md) · [LearningActivity](./LearningActivity.md)
- [Auth](./Auth.md) · [Architecture](./Architecture.md)
