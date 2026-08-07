# Examination Proctoring

Proctoring layer for Step **13**. Integrity policies are enforced in `examinationEngine` (`packages/shared/src/assessment/examination-policies.ts`); session I/O lives in `examination.service.ts`.

## Proctoring modes

| Mode | Description |
| --- | --- |
| `none` | No proctoring |
| `live` | Live invigilator monitoring |
| `record_review` | Session recorded for post-exam review |
| `ai_assisted` | AI flags + human review (placeholder) |

## Secure browser

| Policy | Behavior |
| --- | --- |
| `off` | No restriction |
| `recommended` | Warn if not acknowledged |
| `required` | Block attempt start without acknowledgement |

Configurable flags: block copy/paste · block right-click · block new tabs · require fullscreen · max tab switches · auto-terminate on violation.

## Proctor API

| Method | Path | Permission |
| --- | --- | --- |
| POST | `/examinations/attempts/:id/proctor/session` | `examination:proctor` |
| POST | `/examinations/proctor/events` | `examination:proctor` |
| POST | `/examinations/attempts/:id/proctor/flag` | `examination:proctor` |
| POST | `/examinations/attempts/:id/proctor/clear` | `examination:proctor` |
| POST | `/examinations/attempts/:id/proctor/terminate` | `examination:proctor` |

## Event types

`session_started` · `session_ended` · `tab_switch` · `fullscreen_exit` · `camera_off` · `microphone_off` · `suspicious_activity` · `manual_flag` · `manual_clear` · `attempt_terminated`

Violations increment `violationCount` on the attempt. When `autoTerminateOnViolation` is enabled and count exceeds `maxTabSwitches`, the attempt is terminated via `evaluateProctorViolation`.
