# Enrollment Permissions

| Permission | Description |
| --- | --- |
| `enrollment:read` | Directory, detail, stats, export, audit, own list |
| `enrollment:write` | Self-enroll, waitlist, withdraw own, faculty approve/reject on assigned courses |
| `enrollment:manage` | Full CRUD, bulk ops, import |

## Role matrix

| Role | Access |
| --- | --- |
| Institution Admin | Everything |
| Faculty | Read/write on enrollments for assigned / coordinated courses |
| Student | Own enrollments · request enrollment · withdraw (before deadline) · waitlist |

## Scoping

- Admin: all enrollments in tenant
- Faculty: courses where `facultyIds` contains them or `coordinatorId` matches
- Student: matched via student record email + institution
