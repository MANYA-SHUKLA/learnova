# Mail

Port: `IMailer` in `backend/src/mail`.

## Drivers

| Driver | Status |
| --- | --- |
| `console` | Logs email (default) |
| `smtp` / `nodemailer` | Nodemailer transport (Gmail App Password supported) |
| `resend` | HTTP abstraction (key required) |
| `brevo` | HTTP abstraction (key required) |
| `ses` | Reserved |

## Gmail SMTP (local / institution admin mailbox)

In `backend/.env`:

```env
MAIL_DRIVER=smtp
MAIL_FROM=shuklamanya99@gmail.com
MAIL_QUEUE_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=shuklamanya99@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_SECURE=false
```

**Important:** `SMTP_PASS` must be a Google **App Password**, not your normal Gmail login password.

### Create a Gmail App Password

1. Enable **2-Step Verification** on the Google account  
   https://myaccount.google.com/security
2. Open **App passwords**  
   https://myaccount.google.com/apppasswords
3. Create an app password for “Mail” / “Other (Learnova)”
4. Copy the 16-character password into `SMTP_PASS` (spaces optional)
5. Restart the backend

### Smoke test

```bash
pnpm --filter @learnova/backend mail:test
# or send to another inbox:
pnpm --filter @learnova/backend exec tsx --env-file=.env src/scripts/test-smtp.ts shuklamanya99@gmail.com
```

Success prints `SMTP OK` and delivers a test message. Failure with `535 BadCredentials` means the App Password is wrong/revoked or 2FA is off.

## Queue integration

`sendMail()` enqueues to `email` when `MAIL_QUEUE_ENABLED=true`. For local SMTP debugging set `MAIL_QUEUE_ENABLED=false` so mail sends immediately (no worker required).

## Email layout

All transactional HTML mail goes through `mailHtml()` in `backend/src/mail/mail-copy.ts`:

- Brand header (Learnova)
- Content body + CTA buttons
- Footer with **Manya Shukla**, `shuklamanya99@gmail.com`, phone `8005586588`, and WhatsApp link

Used by: welcome, verify email, password reset, faculty/student credentials.

## Development

Keep `NODE_ENV=development`. Local mail can use `MAIL_DRIVER=console` (logs only) or `MAIL_DRIVER=smtp` with a Gmail App Password for real inbox testing. Do not treat this as production mail setup.

## Security

Never commit `.env` or share App Passwords in chat/PRs. If a password was exposed, revoke it in Google App passwords and create a new one.
