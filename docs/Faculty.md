# Faculty Management

Enterprise ERP module for institution faculty records (Step 5).

## Capabilities

- CRUD with soft delete (archive / restore)
- Activate / deactivate
- Search, filters, pagination, sorting
- Bulk archive / activate / suspend / department / program / academic assign
- CSV import with preview + rollback
- CSV / Excel / PDF export + print
- Profile photo via storage abstraction
- Own-profile change password + login history (sessions)
- Assignments: department, programs, academic year, semester, courses (placeholder)
- Audit trail + domain events
- Role-based permissions

## UI routes

| Route | Purpose |
| --- | --- |
| `/institution/faculty` | Dashboard widgets + directory |
| `/institution/faculty/create` | Create |
| `/institution/faculty/:id` | Profile / details |
| `/institution/faculty/:id/edit` | Edit |
| `/institution/faculty/import` | CSV import |
| `/institution/faculty/export` | Export center |

## Dashboard widgets

Total · Active · Inactive · On Leave · Departments · New this month · Department distribution · Employment types · Recent joinees

## Related docs

- [FacultyAPI.md](./FacultyAPI.md)
- [FacultyPermissions.md](./FacultyPermissions.md)
- [FacultyImportExport.md](./FacultyImportExport.md)
