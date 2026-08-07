# Grade Freeze & Versioning

Every institution publication creates an immutable gradebook snapshot. Republishing increments `snapshotVersion` on the course grade summary and stores a new snapshot document — history is never overwritten.

## Snapshot contents

Each snapshot stores:

- Summary fields: percentage, letter grade, grade points, result, marks totals
- Entry list: activity kind/title, marks, weightage, assessment purpose

`snapshot.immutable` is always `true`.

## API

- `GET /api/v1/gradebook/snapshots?courseId=&studentId?` — list versions
- `GET /api/v1/gradebook/snapshots/compare?courseId=&studentId=&versionFrom=&versionTo=` — field-level diff

## Event

- `grade.snapshot.created`
