# Student Management

Enterprise ERP module for institution student records (Step 6).

## Capabilities

- CRUD with soft delete (archive / restore)
- Activate / suspend / status changes
- Search, filters, pagination, sorting
- Bulk archive / activate / suspend / section / semester / batch / department assign
- CSV import with preview + rollback
- CSV / Excel / PDF export + print
- Profile photo via storage abstraction
- Own-profile updates for student role (limited fields)
- Academic assignments: campus, school, department, program, year, semester, section, batch
- Audit trail + domain events
- Role-based permissions with faculty department scoping

## UI routes

| Route | Purpose |
| --- | --- |
| `/institution/students` | Dashboard widgets + directory |
| `/institution/students/create` | Create |
| `/institution/students/:id` | Profile / details |
| `/institution/students/:id/edit` | Edit |
| `/institution/students/import` | CSV import |
| `/institution/students/export` | Export center |
| `/student/profile` | Own profile (student role) |

## Dashboard widgets

Total · Active · Graduated · Dropped · Departments · Programs · New this month · Department / Program / Batch / Section distribution · Recent admissions

## Status values

`active` · `inactive` · `suspended` · `graduated` · `dropped` · `transferred` · `archived`

## Seed

```bash
pnpm --filter @learnova/backend seed:students
```

Generates 200 students across departments, programs, sections, and batches. Set `SEED_INSTITUTION_ID` and related ref IDs via env.

## Related docs

- [StudentAPI.md](./StudentAPI.md)
- [StudentPermissions.md](./StudentPermissions.md)
- [StudentImportExport.md](./StudentImportExport.md)
