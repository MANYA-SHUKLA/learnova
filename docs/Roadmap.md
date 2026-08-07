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
| **9** | **Assignment Management** | ✅ Complete |
| **9.5** | **Assessment Core (shared)** | ✅ Complete |
| **10** | **Practice Labs / Coding** | ✅ Complete |

**Hard rule:** Course is a **container**. Step 7 ships metadata, ownership, publishing, and academic mapping only. Do **not** fold lessons, files, quizzes, or labs into Step 7.

**Hard rule:** Progress (8.5), Assignments (9), Assessment Core (9.5), and **Practice Labs (10)** are complete. Do **not** start Projects (11) until Labs DoD is met. Enrollments remain the source of truth for each learner’s journey.

### Platform phases (enterprise order)

```
ERP Core (1–6.5) ✅
  ↓
LMS Core (7–8) ✅
  ↓
Learning Progress (8.5) ✅
  ↓
Assignments (9) ✅
  ↓
Assessment Core (9.5) ✅
  ↓
Labs (10) ✅
  ↓
Projects (11)
  ↓
Exams (12)
  ↓
Gradebook (13)
  ↓
Certificates (14)
```

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
Modules → Lessons → Topics → Resources → Assessment → Labs → Projects → Exams → Gradebook → Certificates
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
Assessment (assignments · quizzes · formative)
  ↓
Practice Labs
  ↓
Projects
  ↓
Exams
  ↓
Gradebook
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

Assessment · practice labs · projects · exams · gradebook · attendance · certificates · AI

### Documentation

- `Progress.md`
- `CourseProgress.md`
- `LessonProgress.md`
- `Bookmarks.md`
- `LearningActivity.md`

### Exit criteria (DoD — met)

✓ Enrollment-gated writes · ✓ Published-content rollup · ✓ Permissions + scoping · ✓ Audit/events · ✓ Dashboards · ✓ Seed/tests/docs  

**Hard rule:** Progress DoD is met. Next is **Assessment (Step 9)**. Do **not** start Practice Labs until Assessment DoD is met.

---

## Step 9 — Assignment Management

**Status:** ✅ Complete  
**Goal:** Enterprise assignment coursework — create, publish, submit, grade, comment, rubrics, attachments, role dashboards. **Not** exams, labs, quizzes, projects, gradebook, or certificates.

### Shipped

- Models: Assignment · Submission · Attachment · Comment · Rubric · Grade · Audit
- CRUD · Publish · Archive · Close · Submit · Grade · Comment · Import/Export
- Manual / marks / percentage / pass-fail / rubric grading
- File uploads (PDF · DOCX · ZIP · images · video) with validation
- Search · filters · faculty / student / institution dashboards
- Permissions (`assignment:read|write|manage`), audit, domain events, seed, tests, docs
- UI: `/institution/assignments` · `/faculty/assignments` · `/student/assignments` · `/student/assignments/:id`

### Explicitly out of scope (Do not start)

| Deferred to | Scope |
| --- | --- |
| **10** | Practice Labs / coding |
| **11** | Projects / ideation |
| later | Quizzes · Examinations · Gradebook · Certificates · Attendance · AI |

### Documentation

- `Assignment.md` · `AssignmentAPI.md` · `Submission.md` · `Rubrics.md` · `AssignmentPermissions.md`

### Exit criteria (DoD — met)

✓ Assignment Model · ✓ Submission Model · ✓ Rubrics · ✓ CRUD · ✓ Submission Flow · ✓ Manual Grading · ✓ Comments · ✓ Attachments · ✓ Search · ✓ Filters · ✓ Faculty / Student / Institution Dashboards · ✓ Validation · ✓ Audit · ✓ Events · ✓ Tests · ✓ Documentation  

**Hard rule:** Assignment DoD is met. Assessment Core (9.5) is met. Practice Labs (10) is met — do not start Projects (11) from Assignment work.

---

## Step 9.5 — Assessment Core

**Status:** ✅ Complete  
**Goal:** Shared interfaces, statuses, grading primitives, deadlines, attempts, feedback schemas, audit/event naming, and permission contracts for all assessment modules.

### Shipped

- `@learnova/types` → `assessment/*`
- `@learnova/constants` → assessment enums, file limits, enrollment gate, `assessmentPermission`
- `@learnova/validation` → shared deadline / attempt / marks / grade / feedback / upload schemas
- `@learnova/shared` → pure helpers (lifecycle, submission window, attempts, grade outcome)
- Assignments adapted as thin consumers of the core
- Tests: `__tests__/assessment/core.test.ts`
- Docs: `AssessmentCore.md`, ADR `0006-assessment-core.md`

### Hard rule

Practice Labs (10) ✅, Quizzes, and Exams **must** import Assessment Core helpers — do not duplicate deadline or grading logic.

---

## Step 10 — Practice Labs / Coding Platform

**Status:** ✅ Complete  
**Goal:** Enterprise browser-based coding practice labs with Monaco, Judge0, hidden tests, submissions, progress, leaderboards, and real-time execution status.

### Shipped

- Models: PracticeLab · LabProblem · ProblemTestCase · StudentCodeSubmission · ExecutionHistory · Language · LabProgress · audit
- **Coding Assessment Engine** (`services/coding-engine`) — Judge0, languages, evaluate/score, pluggable storage
- Practice Lab as engine consumer (CRUD, permissions, progress, dashboards)
- API: CRUD, run, submit, history, leaderboard, dashboards, import/export/duplicate/archive
- Frontend: institution / faculty / student routes + Monaco editor
- Seed: `seed:practice-labs` (30 / 300 / 5k / 10k targets)
- Tests: validation · permissions · helpers (+ shared coding scoring)
- Docs: `PracticeLab.md` · `CodingEngine.md` · `Problem.md` · `Judge0.md` · `Execution.md` · `PracticeSubmission.md` · `Leaderboard.md`

### Explicitly out of scope

Projects · Quizzes · MCQ/coding exams · Certificates · Gradebook · Attendance · AI codegen

### Exit criteria (DoD — met)

✓ Practice Lab Module · ✓ Problem Bank · ✓ Monaco · ✓ Judge0 · ✓ **Reusable Coding Engine** · ✓ Run/Submit · ✓ Hidden tests · ✓ Execution history · ✓ Leaderboard · ✓ Progress · ✓ Queue/Socket · ✓ Search/Filters · ✓ Permissions · ✓ Validation · ✓ Audit/Events · ✓ Seed · ✓ Tests · ✓ Docs

**Hard rule:** Stop after Practice Labs. Do **not** start Projects, Quizzes, or Exams.

**Hard rule for Exams (later):** Coding Exams must reuse `services/coding-engine` — only add scheduling, proctoring, attempt rules, and grading policies. No second code runner.

---

## Step 11 — Enterprise Project Management

**Status:** ✅ Complete  
**Goal:** Full academic project lifecycle — faculty create projects, students submit work, approved teams collaborate, milestones tracked, comments threaded, files uploaded, reviews given, and grades prepared. **Not** AI ideation, gradebook sync, exams, or certificates.

### Shipped

- Models: Project · ProjectMember · Milestone · Team · Submission · Comment · Tag · Category · Review · Grade · Progress · Audit
- Evaluation handoff: `evaluationStatus` pending → ready (no grading in Step 11)
- **Collaboration Engine** (`services/collaboration-engine`) — enrollment gate, evaluation-ready workflow
- Academic project types: mini_project · major_project · capstone · research · case_study · industry_project · innovation_challenge · open_project
- Project fields: slug · objective · problemStatement · learningOutcomes · difficulty · category · tags · resources
- Team workflow: pending/approved/rejected/completed · invite · accept/reject · transfer leadership · faculty approval
- Milestone types: proposal · design · implementation · testing · documentation · presentation · final_submission · custom
- Submission: GitHub repo · demo video · live demo URL · text · files
- Comments: threaded CRUD · resolve
- Reviews: score · feedback · suggestions · approval · revision required
- Bulk ops: publish · archive · delete · duplicate · assign faculty
- API: CRUD, bulk, teams, milestones, submissions, comments, reviews, tags, categories, my-team, dashboards, import/export
- Permissions (`project:read|write|manage`), audit, domain events, seed (50/100/500/300), tests
- UI: `/institution/projects/*` · `/faculty/projects/*` · `/student/projects/*` · `/student/my-team`

### Explicitly out of scope

AI ideation · Quizzes · Exams · Gradebook sync · Certificates · Attendance · Judge0 / coding engine

### Documentation

- `CollaborationEngine.md` · `ProjectManagement.md` · `ProjectAPI.md` · `ProjectPermissions.md` · `ProjectTeams.md` · `ProjectMilestones.md` · `ProjectReviews.md`

### Exit criteria (DoD — met)

✓ Collaboration Engine · ✓ Course/Student/Faculty integration · ✓ Evaluation ready (no grading) · ✓ Team approval workflow · ✓ Invitations & transfer leadership · ✓ Milestone types · ✓ Submission (GitHub, demo, live URL) · ✓ Comments (threaded, resolve) · ✓ Reviews (score, suggestions, approval, revision) · ✓ Bulk ops & assign faculty · ✓ Tags & categories · ✓ `/student/my-team` route · ✓ Institution/Faculty/Student dashboards · ✓ Permissions · ✓ Validation · ✓ Audit/Events · ✓ Seed scale · ✓ Tests · ✓ Docs

**Hard rule:** Stop after Projects. Do **not** start Exams or Gradebook from this step. Gradebook (Step 13) will consume prepared project grades.

---

## Later Academic Assessment & platform steps

| Step | Scope | State |
| --- | --- | --- |
| **7.5** | Course Content Builder (modules / lessons / resources) | ✅ Complete |
| **8** | Enrollments | ✅ Complete |
| **8.25** | Enrollment Integration Checkpoint | ✅ Complete |
| **8.5** | Progress tracking | ✅ Complete |
| **9** | **Assignment Management** | ✅ Complete |
| **9.5** | **Assessment Core (shared)** | ✅ Complete |
| **10** | Practice Labs / Coding | ✅ Complete |
| **11** | **Enterprise Project Management** | ✅ Complete |
| **12** | Examinations | Planned |
| **13** | Gradebook | Planned |
| **14** | Certificates (platform-wide) | Planned |
| **15** | Analytics & Notifications | Planned |
| **16** | AI content generation | Planned |

**Boundary:** Keep Course Management focused on metadata, ownership, publishing, and academic mapping. Build contents (modules, lessons, assessments, labs, etc.) in subsequent steps so the codebase stays clean as the platform grows.

**Boundary:** Practice Labs (10) DoD met — consume Assessment Core. Projects (11) DoD met — consume Assessment Core. **Next is Examinations (12).** Do not start gradebook from this step.

---

## Related docs

- [API (Swagger)](./API.md) — interactive docs at `http://localhost:4000/docs`
- [Institution](./Institution.md) · [Academic Structure](./AcademicStructure.md)
- [Faculty](./Faculty.md) · [Student](./Student.md) · [Course](./Course.md)
- [Enrollment](./Enrollment.md) · [EnrollmentWorkflow](./EnrollmentWorkflow.md)
- [Progress](./Progress.md) · [CourseProgress](./CourseProgress.md) · [LessonProgress](./LessonProgress.md)
- [Bookmarks](./Bookmarks.md) · [LearningActivity](./LearningActivity.md)
- [Assignment](./Assignment.md) · [AssignmentAPI](./AssignmentAPI.md) · [Submission](./Submission.md)
- [Rubrics](./Rubrics.md) · [AssignmentPermissions](./AssignmentPermissions.md)
- [AssessmentCore](./AssessmentCore.md) · [ADR 0006](./adr/0006-assessment-core.md)
- [PracticeLab](./PracticeLab.md) · [CodingEngine](./CodingEngine.md) · [Problem](./Problem.md) · [Judge0](./Judge0.md) · [Execution](./Execution.md)
- [PracticeSubmission](./PracticeSubmission.md) · [Leaderboard](./Leaderboard.md)
- [ProjectManagement](./ProjectManagement.md) · [ProjectAPI](./ProjectAPI.md) · [ProjectPermissions](./ProjectPermissions.md) · [ProjectTeams](./ProjectTeams.md) · [ProjectMilestones](./ProjectMilestones.md) · [ProjectReviews](./ProjectReviews.md)
- [AccessModel](./AccessModel.md) · [Auth](./Auth.md) · [Architecture](./Architecture.md)
- [Deploy](./Deploy.md) — Vercel (frontend) + Render (backend)
