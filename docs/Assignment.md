# Assignment Management

Enterprise coursework assessment layer (Step **9**). Assignments are course activities attached to a **course**, optionally a **module** or **lesson**. They are **not** exams, coding labs, quizzes, projects, gradebook, or certificates.

```
Enrollment → Published Assignment → Submission → Grade / Feedback
```

## Capabilities

- Assignment CRUD with types, deadlines, late policy, resubmission / max attempts
- Publish · archive · close lifecycle
- Student draft + submit (enrollment-gated), late detection
- Manual / marks / percentage / pass-fail / rubric grading
- Reusable rubrics (criteria · weight · points)
- Threaded comments (faculty ↔ student) with optional attachments
- File uploads (PDF · DOCX · ZIP · images · video) with size/type validation
- Search & filters (course · module · lesson · status · due · late · graded)
- Import / export
- Role dashboards: institution · faculty · student
- Audit trail + domain events
- Seed: ~100 assignments · ~1000 submissions · rubrics · grades · comments

## Assignment types

Homework · Essay · Research · Presentation · Case Study · Document / PDF / Image / Video Upload · Mixed

## Status

| Status | Meaning |
| --- | --- |
| `draft` | Editable, not visible to students |
| `published` | Visible to enrolled students (per visibility) |
| `closed` | No new submissions |
| `archived` | Soft-retired |

## Submission status

`draft` · `submitted` · `late` · `returned` · `graded` · `missing`

## Permissions

| Permission | Roles |
| --- | --- |
| `assignment:read` | student, faculty, institution_admin |
| `assignment:write` | student (own submit/comment), faculty (own assignments + grading), institution_admin |
| `assignment:manage` | institution_admin |

**Scoping**

- Institution — everything in tenant
- Faculty — own / course-scoped assignments and submissions
- Student — published assignments for enrolled courses; own submissions only

## API

Base: `/api/v1/assignments` — see [AssignmentAPI.md](./AssignmentAPI.md)

## UI routes

| Role | Path |
| --- | --- |
| Institution | `/institution/assignments` |
| Faculty | `/faculty/assignments` |
| Student | `/student/assignments`, `/student/assignments/:id` |

## Related docs

- [AssignmentAPI.md](./AssignmentAPI.md)
- [Submission.md](./Submission.md)
- [Rubrics.md](./Rubrics.md)
- [AssignmentPermissions.md](./AssignmentPermissions.md)

## Out of scope

Practice Labs · Judge0 · Projects · Quizzes · Exams · Certificates · Gradebook · Attendance · AI

## Seed

```bash
pnpm --filter @learnova/backend seed:assignments
# SEED_FORCE=1 to replace
```

Requires `SEED_INSTITUTION_ID` plus existing courses and students.
