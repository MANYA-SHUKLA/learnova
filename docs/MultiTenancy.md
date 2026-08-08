# Multi-Tenancy

Each institution is an isolated tenant. All ERP/LMS documents include `institutionId`.

## JWT tenant context

Access tokens carry `institutionId`. `tenantGuard()` rejects authenticated requests without it.

## Repository pattern

Repositories accept `institutionId` as the first argument and include it in every query:

```typescript
CourseModel.findOne({ _id: id, institutionId, deletedAt: null })
```

## Service layer

`requireTenant(actor)` throws if `actor.institutionId` is missing.

## Cross-tenant access

Impossible by design when controllers build `ActorContext` from JWT — never from client-supplied tenant ids.

## Soft delete

Queries default to `deletedAt: null` unless `includeDeleted` is explicitly allowed for admins.

## Verification

Platform smoke test uses a single institution seed; future multi-institution tests should assert zero cross-tenant reads.
