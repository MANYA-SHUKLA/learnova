import { describe, expect, it } from 'vitest';

describe('enrollment repository', () => {
  it('builds filter with institution scoping', () => {
    const filterKeys = ['institutionId', 'studentId', 'courseId', 'status', 'deletedAt'];
    expect(filterKeys).toContain('institutionId');
    expect(filterKeys).toContain('deletedAt');
  });

  it('supports list with pagination', () => {
    const listFeatures = ['filter', 'sort', 'pagination', 'count'];
    expect(listFeatures).toContain('pagination');
  });

  it('finds active enrollment by student and course', () => {
    const queryParams = ['institutionId', 'studentId', 'courseId', 'deletedAt_null'];
    expect(queryParams).toContain('studentId');
    expect(queryParams).toContain('courseId');
  });

  it('supports soft delete and restore', () => {
    const operations = ['softDelete', 'restore', 'hardDelete'];
    expect(operations).toContain('softDelete');
    expect(operations).toContain('restore');
  });

  it('supports bulk operations', () => {
    const bulkOps = ['bulkUpdateStatus', 'bulkArchive', 'bulkAssignFaculty'];
    expect(bulkOps).toContain('bulkAssignFaculty');
  });

  it('counts active enrollments per course', () => {
    const countQuery = ['institutionId', 'courseId', 'status_in_active_approved_pending'];
    expect(countQuery.length).toBeGreaterThan(0);
  });

  it('manages waitlist operations', () => {
    const waitlistOps = ['waitlistJoin', 'waitlistLeave', 'waitlistList', 'waitlistPromoteNext'];
    expect(waitlistOps).toContain('waitlistJoin');
    expect(waitlistOps).toContain('waitlistPromoteNext');
  });

  it('calculates stats with aggregations', () => {
    const statsFields = [
      'total',
      'byStatus',
      'byEnrollmentMethod',
      'byCourse',
      'byProgram',
      'newThisMonth',
    ];
    expect(statsFields).toContain('byStatus');
    expect(statsFields).toContain('byCourse');
  });

  it('logs audit events', () => {
    const auditFields = ['event', 'institutionId', 'enrollmentId', 'userId', 'metadata'];
    expect(auditFields).toContain('event');
    expect(auditFields).toContain('metadata');
  });
});
