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
| **6.5** | **System Integration & Demo** | 🔄 In progress |
| 7 | Course Management (LMS) | 🔒 After 6.5 |

**Hard rule:** ERP core (1–6) + Integration Demo (6.5) before LMS Course Management.

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

**Status:** 🔄 In progress  
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

**Status:** 🔒 Blocked on Step 6.5  
**Scale:** Largest module after Exams. Enterprise LMS course system — not just title + description.

### Course hierarchy

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
| Classification | `category`, `level`, `language`, `tags`, `difficulty` |
| Academic links | `department`, `program`, `semester`, `credits`, `estimatedHours` |
| People | `facultyIds`, `coordinatorId` |
| Pedagogy | `prerequisites`, `outcomes`, `requirements` |
| Access | `visibility`, `status`, `enrollmentMode`, `maxStudents` |
| Features | `certificateEnabled`, `discussionEnabled` |
| Lifecycle | `version`, `publishedAt`, `archivedAt`, `createdBy`, `updatedBy`, timestamps |

### Course builder

```
Module → Lesson → Content
```

**Content types:** Video · PDF · Markdown · HTML · Image · Audio · External Link · Embed · Code Block · Download · Presentation

### Student progress (per lesson)

Started · Completed · Watch % · Reading % · Time · Bookmarks · Notes · Last Position

### Role features

| Role | Capabilities |
| --- | --- |
| **Faculty** | Create · Edit · Duplicate · Archive · Publish · Preview · Assign Faculty · Assign Students · Manage Modules · Upload Files · Generate AI Content (later) · View Analytics |
| **Student** | Enroll · Continue Learning · Bookmarks · Notes · Downloads · Progress · Discussion · Certificate |
| **Institution Admin** | Approve · Assign Faculty · Archive · Restore · Duplicate · Publish · Analytics · Export |

### Permissions

| Role | Access |
| --- | --- |
| Institution | Everything |
| Faculty | Own courses |
| Student | Enrolled courses |

### Search & filters

**Search:** Title · Code · Faculty · Department · Program · Semester · Tags  

**Filters:** Published · Draft · Archived · Department · Credits · Difficulty · Faculty · Language

### Course dashboard

Total Courses · Published · Draft · Enrollments · Completion · Faculty · Recent Updates

### AI *(later — not in initial Step 7 ship)*

Generate Outline · Lessons · Quiz · Assignment · Lab · Project

### Documentation (generate with Step 7)

- `Course.md`
- `CourseAPI.md`
- `CoursePermissions.md`
- `CourseBuilder.md`
- `CourseProgress.md`

### Testing (Step 7 DoD)

CRUD · Permissions · Builder · Publishing · Search · Filters · Progress · Analytics · Import · Export

---

## Later LMS & platform steps

| Step | Scope | State |
| --- | --- | --- |
| 8 | Enrollments (if not folded into Course) | Planned |
| 9 | Practice Labs / Coding | Planned |
| 10 | Projects / Ideation | Planned |
| 11 | Examinations | Planned |
| 12 | Attendance / Grades | Planned |
| 13 | Certificates (platform-wide) | Planned |
| 14 | Analytics & Notifications | Planned |
| 15 | AI content generation | Planned |

Ordering of Steps 8+ may shift as Course Management lands; exams remain a peer-scale module.

---

## Related docs

- [Institution](./Institution.md) · [Academic Structure](./AcademicStructure.md)
- [Faculty](./Faculty.md) · [Student](./Student.md)
- [Auth](./Auth.md) · [Architecture](./Architecture.md)
