# Secure browser (Step 13)

Exam secure mode is enforced on the **frontend** via `useSecureExamMode()` in `frontend/src/features/examination/hooks/use-secure-exam-mode.ts`.

## What the hook blocks

- Copy, cut, paste
- Right-click / context menu
- Tab blur and Page Visibility changes (reported as violations)
- Fullscreen exit when `requireFullscreen` is enabled

Violations are reported to `POST /api/v1/examinations/attempts/:id/violations` and broadcast on Socket.IO `/exam` as `live.violation.recorded`.

## Policy source

Secure browser settings come from the exam's `proctoring` object (or reusable `ExamPolicy` templates). Question evaluation and scoring are **not** implemented here — they remain in Assessment Core (`examinationEngine`).

## Student flow

1. `/student/examinations/:id/check-in` — system check (network, camera, mic, fullscreen)
2. `/student/examinations/:id` — check-in → start → take exam with hook active

See also [ExamProctoring.md](./ExamProctoring.md) and [ExamManagement.md](./ExamManagement.md).
