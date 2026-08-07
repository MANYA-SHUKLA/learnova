import { describe, expect, it } from 'vitest';
import { StudentRepository } from '../../repositories/student/index.js';

const OID = '507f1f77bcf86cd799439011';
const institutionId = OID;

describe('StudentRepository buildFilter', () => {
  const repo = new StudentRepository();

  it('builds base filter with institutionId', () => {
    const filter = repo.buildFilter(institutionId, {
      page: 1,
      limit: 20,
      includeDeleted: false,
    });
    expect(filter).toHaveProperty('institutionId');
    expect(filter.deletedAt).toBe(null);
  });

  it('filters by status', () => {
    const filter = repo.buildFilter(institutionId, {
      status: 'active',
      page: 1,
      limit: 20,
      includeDeleted: false,
    });
    expect(filter.status).toBe('active');
  });

  it('filters by departmentId and programId', () => {
    const filter = repo.buildFilter(institutionId, {
      departmentId: OID,
      programId: OID,
      page: 1,
      limit: 20,
      includeDeleted: false,
    });
    expect(filter).toHaveProperty('departmentId');
    expect(filter).toHaveProperty('programId');
  });

  it('filters by sectionId, batchId, and yearOfStudy', () => {
    const filter = repo.buildFilter(institutionId, {
      sectionId: OID,
      batchId: OID,
      yearOfStudy: 2,
      page: 1,
      limit: 20,
      includeDeleted: false,
    });
    expect(filter).toHaveProperty('sectionId');
    expect(filter).toHaveProperty('batchId');
    expect(filter.yearOfStudy).toBe(2);
  });

  it('filters by scholarship', () => {
    const filter = repo.buildFilter(institutionId, {
      scholarship: true,
      page: 1,
      limit: 20,
      includeDeleted: false,
    });
    expect(filter.scholarship).toBe(true);
  });

  it('builds search query with $or', () => {
    const filter = repo.buildFilter(institutionId, {
      q: 'Priya',
      page: 1,
      limit: 20,
      includeDeleted: false,
    });
    expect(filter).toHaveProperty('$or');
    expect(Array.isArray(filter.$or)).toBe(true);
  });
});
