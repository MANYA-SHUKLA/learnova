# Secure Browser Mode

Client-side secure exam mode for Step **13**. Server policy is validated by `examinationEngine.validateSecureBrowser`; the frontend hook `useSecureExamMode` enforces browser restrictions during an active attempt.

## Server policy (`Exam.proctoring`)

| Flag | Default | Effect |
| --- | --- | --- |
| `secureBrowser` | `recommended` | `off` · `recommended` · `required` |
| `requireFullscreen` | `true` | Block start without acknowledgement when required |
| `blockCopyPaste` | `true` | Clipboard events blocked client-side |
| `blockRightClick` | `true` | Context menu blocked |
| `blockNewTabs` | `true` | Tab/window blur reported as violation |

## Client hook

`apps/frontend/src/features/examination/hooks/use-secure-exam-mode.ts`

- Requests fullscreen when `requireFullscreen`
- Blocks copy/cut/paste and context menu
- Reports `tab_switch`, `fullscreen_exit`, `clipboard_attempt` via `POST /examinations/attempts/:id/violations`

## Violation flow

```
Browser event → useSecureExamMode → reportViolation API
  → examinationEngine.evaluateProctorViolation
  → ExamViolation record + Socket.IO live.violation.recorded
```

## Limitations

Full OS-level lockdown requires a dedicated secure browser client (out of scope). This implementation provides enterprise-grade deterrents and audit trail suitable for web delivery.

See [Proctoring.md](./ExamProctoring.md) (alias: ExamProctoring.md).
