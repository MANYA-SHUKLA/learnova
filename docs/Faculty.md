# Faculty Management

Enterprise ERP module for managing institution faculty records.

## Scope

- Faculty CRUD with soft delete (archive / restore)
- Search, filters, pagination, sorting
- Bulk activate / suspend / archive / assign department / assign programs
- CSV import with preview, validation, duplicate detection, rollback
- CSV / Excel / PDF export + print
- Profile photo upload via storage abstraction
- Audit trail + domain events
- Role-based permissions

## UI routes

| Route | Purpose |
| --- | --- |
| `/institution/faculty` | Directory + stats dashboard |
| `/institution/faculty/create` | Create faculty |
| `/institution/faculty/:id` | Profile |
| `/institution/faculty/:id/edit` | Edit |
| `/institution/faculty/import` | CSV import |
| `/institution/faculty/export` | Export center |

## Backend layout

- Model: `apps/backend/src/models/faculty.model.ts`
- Audit: `apps/backend/src/models/faculty-audit-log.model.ts`
- Repository: `apps/backend/src/repositories/faculty/`
- Service: `apps/backend/src/services/faculty/faculty.service.ts`
- Controller / routes: `controllers/faculty`, `routes/v1/faculty.routes.ts`

## Frontend layout

- Feature: `apps/frontend/src/features/faculty/`
- Pages under `app/[locale]/(dashboard)/institution/faculty/`

## Related docs

- [FacultyAPI.md](./FacultyAPI.md)
- [FacultyPermissions.md](./FacultyPermissions.md)
- [FacultyImportExport.md](./FacultyImportExport.md)
