# Enrollment Workflow

## Manual (institution)

Admin creates enrollment → typically `active` / `approved` (or pending if configured) → mapped to academic structure.

## Self enrollment

```
Student requests course
        ↓
Check enrollmentDeadline
        ↓
Check enrollmentMode
  open        → create active enrollment
  approval    → create pending enrollment
  invite      → reject unless invite path
  closed      → reject
        ↓
If at maxStudents and waitlistEnabled → join waitlist
```

## Approval

```
Pending enrollment
        ↓
Faculty / Institution reviews
        ↓
Approve → active (+ course.enrolled event)
Reject  → rejected (+ notes)
```

## Withdraw

Student or staff withdraws → `withdrawn` + `withdrawReason` → auto-promote next waitlist entry when capacity frees.

## Complete

Staff marks enrollment `completed` with `completionStatus: completed` and `completionDate`.

## Waitlist

Join → position assigned · Leave → remove · Promote → create enrollment when seat available.
