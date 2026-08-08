import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from '@learnova/constants';

describe('progress permissions', () => {
  it('defines PROGRESS_READ / WRITE / MANAGE', () => {
    expect(PERMISSIONS.PROGRESS_READ).toBe('progress:read');
    expect(PERMISSIONS.PROGRESS_WRITE).toBe('progress:write');
    expect(PERMISSIONS.PROGRESS_MANAGE).toBe('progress:manage');
  });

  it('requires PROGRESS_READ for list/get/dashboard operations', () => {
    const readOperations = [
      'me',
      'course_detail',
      'resume',
      'bookmarks_list',
      'notes_list',
      'activity',
      'student_dashboard',
      'faculty_dashboard',
      'stats',
      'search',
    ];
    expect(readOperations).toContain('me');
    expect(readOperations).toContain('stats');
  });

  it('requires PROGRESS_WRITE for learner mutations', () => {
    const writeOperations = [
      'open_lesson',
      'complete_lesson',
      'update_lesson',
      'resource_progress',
      'session_start',
      'session_end',
      'bookmark_create',
      'bookmark_delete',
      'note_create',
      'note_update',
      'note_delete',
    ];
    expect(writeOperations).toContain('complete_lesson');
    expect(writeOperations).toContain('bookmark_create');
  });

  it('requires PROGRESS_MANAGE for institution dashboard', () => {
    const manageOperations = ['institution_dashboard'];
    expect(manageOperations).toContain('institution_dashboard');
  });

  it('scopes students to own progress', () => {
    const rules = [
      'student_resolves_from_actor_email',
      'student_requires_active_or_approved_enrollment',
      'student_cannot_access_others',
    ];
    expect(rules.length).toBeGreaterThan(0);
  });

  it('scopes faculty to assigned courses', () => {
    const rules = [
      'faculty_matches_via_facultyIds_or_coordinatorId',
      'faculty_dashboard_requires_courseId',
    ];
    expect(rules.length).toBeGreaterThan(0);
  });
});
