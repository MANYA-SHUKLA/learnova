# Institution

Tenant root for Learnova multi-campus organizations.

## Purpose

The institution record is created after auth registration using the JWT `institutionId` as the document `_id`. All academic hierarchy entities are scoped by this tenant id.

## Collection

`institutions`

## Fields

| Field | Notes |
| --- | --- |
| name, shortName, slug, code | Identity; slug/code/email unique |
| email, phone, website | Contact |
| logo, favicon | Branding URLs (storage abstraction) |
| timezone, currency | Defaults `UTC` / `USD` |
| country, state, city, postalCode, address | Location |
| status | `active` \| `inactive` \| `archived` |
| subscriptionPlan, subscriptionStart, subscriptionEnd | Plan metadata |
| maxStudents, maxFaculty, maxStorage | Soft caps |
| deletedAt | Soft delete |

## Indexes

- `slug` (unique)
- `code` (unique)
- `email` (unique)

## Permissions

| Role | Access |
| --- | --- |
| Institution Admin | Create, edit, archive, restore (`institution:manage` + `institution:read`) |
| Faculty | Read only (`institution:read`) |
| Student | No access |

## Audit

- `institution.created`
- `institution.updated`
- Soft archive / restore via `entity.archived` / `entity.restored`

## UI

- `/institution` — dashboard
- `/institution/profile` — profile + branding

## Notes

- Do not invent a second institution id; bootstrap uses the auth-issued tenant id.
- Cross-institution reads are denied except for `super_admin`.
