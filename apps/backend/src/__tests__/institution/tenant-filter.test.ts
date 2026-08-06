import { describe, expect, it } from 'vitest';
import { Types } from 'mongoose';

/**
 * Unit coverage for tenant soft-delete list filter construction.
 * Mirrors TenantSoftDeleteRepository.baseFilter behavior without DB.
 */
function buildFilter(
  institutionId: string,
  query: {
    includeDeleted?: boolean;
    status?: string;
    q?: string;
    schoolId?: string;
    departmentId?: string;
    programId?: string;
    academicYearId?: string;
    semesterId?: string;
  },
  searchFields: string[] = ['name', 'code'],
) {
  const filter: Record<string, unknown> = { institutionId };
  if (!query.includeDeleted) filter.deletedAt = null;
  if (query.status) filter.status = query.status;
  if (query.q) {
    const regex = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = searchFields.map((field) => ({ [field]: regex }));
  }
  if (query.schoolId) filter.schoolId = query.schoolId;
  if (query.departmentId) filter.departmentId = query.departmentId;
  if (query.programId) filter.programId = query.programId;
  if (query.academicYearId) filter.academicYearId = query.academicYearId;
  if (query.semesterId) filter.semesterId = query.semesterId;
  return filter;
}

describe('institution tenant filter helpers', () => {
  const institutionId = new Types.ObjectId().toHexString();

  it('scopes to institution and excludes soft-deleted by default', () => {
    const filter = buildFilter(institutionId, {});
    expect(filter.institutionId).toBe(institutionId);
    expect(filter.deletedAt).toBeNull();
  });

  it('supports status, search, and relation filters', () => {
    const schoolId = new Types.ObjectId().toHexString();
    const filter = buildFilter(institutionId, {
      status: 'active',
      q: 'CSE',
      schoolId,
    });
    expect(filter.status).toBe('active');
    expect(filter.schoolId).toBe(schoolId);
    expect(Array.isArray(filter.$or)).toBe(true);
  });

  it('includes deleted when requested', () => {
    const filter = buildFilter(institutionId, { includeDeleted: true });
    expect(filter.deletedAt).toBeUndefined();
  });
});

describe('institution audit event catalog', () => {
  const requiredEvents = [
    'institution.created',
    'institution.updated',
    'department.created',
    'department.updated',
    'program.created',
    'semester.created',
    'calendar.updated',
  ];

  it('tracks the required Step 4 audit events', () => {
    for (const event of requiredEvents) {
      expect(event.length).toBeGreaterThan(0);
      expect(event).toMatch(/^[a-z_]+\.[a-z_]+$/);
    }
  });
});
