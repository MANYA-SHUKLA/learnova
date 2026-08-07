# Modules

Course content modules (Step 7.5).

## Fields

`id` · `courseId` · `title` · `slug` · `description` · `moduleNumber` · `orderIndex` · `estimatedMinutes` · `visibility` · `status` · `icon` · `color` · `isLocked` · `unlockAfterModuleId` · audit timestamps · soft delete

## Status

`draft` · `published` · `hidden` · `archived`

## Visibility

`private` · `enrolled` · `public`

## APIs (under `/api/v1/courses/:courseId`)

| Method | Path |
| --- | --- |
| GET/POST | `/modules` |
| GET/PATCH/DELETE | `/modules/:moduleId` |
| POST | `/modules/:moduleId/restore` |
| POST | `/modules/:moduleId/duplicate` |
| POST | `/modules/:moduleId/archive` |
| POST | `/builder/reorder` (includes module `orderIndex`) |

## Audit / events

`module.created` · `module.updated` · `module.deleted` (+ restore/duplicate audit variants)
