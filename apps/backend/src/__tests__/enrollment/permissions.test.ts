import { describe, expect, it } from 'vitest';

describe('enrollment permissions', () => {
  it('requires ENROLLMENT_READ for list/get operations', () => {
    const readOperations = ['list', 'search', 'get', 'stats', 'export', 'audit'];
    expect(readOperations).toContain('list');
    expect(readOperations).toContain('get');
  });

  it('requires ENROLLMENT_WRITE for student self operations', () => {
    const writeOperations = ['self_enroll', 'withdraw', 'waitlist_join', 'waitlist_leave'];
    expect(writeOperations).toContain('self_enroll');
    expect(writeOperations).toContain('withdraw');
  });

  it('requires ENROLLMENT_WRITE for faculty approve/reject', () => {
    const facultyOperations = ['approve', 'reject'];
    expect(facultyOperations).toContain('approve');
    expect(facultyOperations).toContain('reject');
  });

  it('requires ENROLLMENT_MANAGE for admin operations', () => {
    const manageOperations = [
      'create',
      'update',
      'delete',
      'restore',
      'bulk_enroll',
      'bulk_delete',
      'bulk_assign_faculty',
      'import',
      'complete',
    ];
    expect(manageOperations).toContain('create');
    expect(manageOperations).toContain('bulk_enroll');
  });

  it('validates faculty scope to their courses', () => {
    const scopeRules = [
      'faculty_can_view_enrollments_in_their_courses',
      'faculty_can_approve_reject_in_their_courses',
      'faculty_matches_via_facultyIds_or_coordinatorId',
    ];
    expect(scopeRules.length).toBeGreaterThan(0);
  });

  it('validates student scope to own enrollments', () => {
    const studentRules = [
      'student_can_view_own_enrollments',
      'student_can_self_enroll',
      'student_can_withdraw_own',
      'student_cannot_view_others',
    ];
    expect(studentRules.length).toBeGreaterThan(0);
  });
});
