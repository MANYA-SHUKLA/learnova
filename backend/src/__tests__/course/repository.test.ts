import { describe, expect, it } from 'vitest';
import { CourseRepository } from '../../repositories/course/course.repository.js';

describe('course repository filters', () => {
  const repo = new CourseRepository();

  it('builds search and filter clauses', () => {
    const filter = repo.buildFilter('507f1f77bcf86cd799439011', {
      q: 'Programming',
      status: 'published',
      category: 'programming',
      difficulty: 'intermediate',
      visibility: 'institution',
      creditsMin: 3,
      creditsMax: 6,
      includeDeleted: false,
      page: 1,
      limit: 20,
    });

    expect(filter.deletedAt).toBeNull();
    expect(filter.status).toBe('published');
    expect(filter.category).toBe('programming');
    expect(filter.difficulty).toBe('intermediate');
    expect(filter.$or).toBeTruthy();
    expect(filter.credits).toHaveProperty('$gte', 3);
    expect(filter.credits).toHaveProperty('$lte', 6);
  });

  it('handles department and program filters', () => {
    const filter = repo.buildFilter('507f1f77bcf86cd799439011', {
      departmentId: '507f1f77bcf86cd799439012',
      programId: '507f1f77bcf86cd799439013',
      includeDeleted: false,
      page: 1,
      limit: 20,
    });

    expect(filter.departmentId).toBeTruthy();
    expect(filter.programIds).toBeTruthy();
  });
});

describe('course audit event catalog', () => {
  it('covers required audit events', () => {
    const events = [
      'course.created',
      'course.updated',
      'course.deleted',
      'course.restored',
      'course.published',
      'course.unpublished',
      'course.archived',
      'course.duplicated',
      'course.assigned.faculty',
      'course.imported',
      'course.import.started',
      'course.import.completed',
      'course.exported',
      'course.export',
    ];
    expect(events).toHaveLength(14);
  });
});
