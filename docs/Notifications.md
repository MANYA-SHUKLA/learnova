# Notifications (v1.0)

Learnova notifications are **event-driven alerts**, not a messaging platform. No chat threads, no social feed, no parent portal inbox.

Students and faculty get a bell icon in the top bar plus a full page at `/notifications`.

---

## What triggers a notification

| Type | When |
| --- | --- |
| `grade_published` | Official grades published for a course |
| `certificate_issued` | Certificate generated (often right after grades + auto-issue) |
| `assignment_due` | Assignment due within 24h (scheduler, every 6h) |
| `project_deadline` | Project due within 24h (same scheduler) |
| `exam_scheduled` | Exam scheduled for enrolled students |
| `course_announcement` | Faculty/admin posts via API |

Typical launch path: **grade published → certificate issued** — two notifications, in-app and optionally email.

---

## Delivery

1. Saved to MongoDB (`notifications` collection)
2. Pushed live via Socket.io (`/notifications` namespace)
3. Email queued through BullMQ if `MAIL_DRIVER` is not `console` and institution has email enabled

Turn off globally: `ENABLE_NOTIFICATIONS=false` on backend.

---

## API (authenticated)

```
GET    /api/v1/notifications              list + search (q) + unreadOnly
GET    /api/v1/notifications/unread-count
POST   /api/v1/notifications/read-all
POST   /api/v1/notifications/:id/read
DELETE /api/v1/notifications/:id
POST   /api/v1/notifications/announcements   faculty/admin — course announcement
```

Students use list/read/delete only. Announcements require course access.

---

## Local testing

1. Start backend + worker + frontend
2. Publish grades for a seeded course (or use existing published summaries from seed)
3. Open student account → bell icon should show unread count
4. Run `pnpm verify:platform` — includes notification list smoke

Email: configure SMTP on backend **and** worker. See [Mail.md](./Mail.md).

---

## Out of scope

Push notifications (mobile), SMS, WhatsApp, discussion forums, read receipts, @mentions, DMs between users.
