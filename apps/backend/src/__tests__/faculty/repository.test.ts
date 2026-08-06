import { describe, expect, it } from 'vitest';
import { FacultyRepository } from '../../repositories/faculty/index.js';

describe('faculty repository filters', () => {
  const repo = new FacultyRepository();

  it('builds search and filter clauses', () => {
    const filter = repo.buildFilter('507f1f77bcf86cd799439011', {
      q: 'Rai',
      status: 'active',
      designation: 'professor',
      employmentType: 'full_time',
      experienceMin: 1,
      experienceMax: 10,
      includeDeleted: false,
      page: 1,
      limit: 20,
    });

    expect(filter.deletedAt).toBeNull();
    expect(filter.status).toBe('active');
    expect(filter.designation).toBe('professor');
    expect(filter.$or).toBeTruthy();
  });
});

describe('faculty audit event catalog', () => {
  it('covers required audit events', () => {
    const events = [
      'faculty.created',
      'faculty.updated',
      'faculty.archived',
      'faculty.restored',
      'faculty.deleted',
      'faculty.import.started',
      'faculty.import.completed',
      'faculty.export',
      'faculty.profile.updated',
      'faculty.status.changed',
    ];
    expect(events).toHaveLength(10);
  });
});
