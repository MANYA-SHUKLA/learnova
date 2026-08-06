# Mail

Port: `IMailer` in `apps/backend/src/mail`.

## Drivers

| Driver | Status |
| --- | --- |
| `console` | Logs email (default) |
| `smtp` / `nodemailer` | Nodemailer transport |
| `resend` | HTTP abstraction (key required) |
| `brevo` | HTTP abstraction (key required) |
| `ses` | Reserved |

## Queue integration

`sendMail()` enqueues to `email` when `MAIL_QUEUE_ENABLED=true` (default). Worker email processor sends via console/SMTP.

## Rule

No templates in this phase.
