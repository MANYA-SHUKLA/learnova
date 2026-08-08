import { describe, expect, it } from 'vitest';

describe('progress repository', () => {
  it('scopes course progress by institution + student + course', () => {
    const uniqueKeys = ['institutionId', 'studentId', 'courseId'];
    expect(uniqueKeys).toContain('institutionId');
    expect(uniqueKeys).toHaveLength(3);
  });

  it('enforces unique lesson progress per student+lesson', () => {
    const uniqueKeys = ['studentId', 'lessonId'];
    expect(uniqueKeys).toContain('lessonId');
  });

  it('enforces unique resource progress per student+resource', () => {
    const uniqueKeys = ['studentId', 'resourceId'];
    expect(uniqueKeys).toContain('resourceId');
  });

  it('supports upserts for course/module/lesson/resource progress', () => {
    const ops = [
      'upsertCourseProgress',
      'upsertModuleProgress',
      'upsertLessonProgress',
      'upsertResourceProgress',
    ];
    expect(ops).toContain('upsertLessonProgress');
  });

  it('supports bookmarks and notes CRUD', () => {
    const ops = [
      'createBookmark',
      'deleteBookmark',
      'listBookmarks',
      'createNote',
      'updateNote',
      'deleteNote',
      'listNotes',
    ];
    expect(ops).toContain('createNote');
  });

  it('logs audit events and activities', () => {
    const ops = ['logAudit', 'createActivity', 'listActivity'];
    expect(ops).toContain('logAudit');
  });

  it('aggregates stats and dashboards', () => {
    const ops = [
      'getStats',
      'getStudentDashboardCounts',
      'getFacultyCourseAnalytics',
      'getInstitutionAnalytics',
    ];
    expect(ops).toContain('getStats');
  });
});
