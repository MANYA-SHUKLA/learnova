import { describe, expect, it } from 'vitest';
import {
  ASSIGNMENT_MAX_FILE_BYTES,
  assignmentFileUploadSchema,
  assignmentListQuerySchema,
  createAssignmentSchema,
  createCommentSchema,
  createRubricSchema,
  gradeSubmissionSchema,
  submissionListQuerySchema,
  submitAssignmentSchema,
  updateAssignmentSchema,
} from '@learnova/validation';

const OBJECT_ID = '507f1f77bcf86cd799439011';

describe('assignment validation', () => {
  it('applies defaults when creating an assignment', () => {
    const parsed = createAssignmentSchema.parse({
      courseId: OBJECT_ID,
      title: 'Weekly Problem Set 1',
    });

    expect(parsed.assignmentType).toBe('homework');
    expect(parsed.visibility).toBe('enrolled');
    expect(parsed.totalMarks).toBe(100);
    expect(parsed.passingMarks).toBe(40);
    expect(parsed.maxAttempts).toBe(1);
    expect(parsed.allowLateSubmission).toBe(true);
    expect(parsed.allowResubmission).toBe(false);
  });

  it('rejects a non-ObjectId courseId', () => {
    const result = createAssignmentSchema.safeParse({ courseId: 'nope', title: 'X' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty title', () => {
    const result = createAssignmentSchema.safeParse({ courseId: OBJECT_ID, title: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects out-of-range marks and weightage', () => {
    expect(
      createAssignmentSchema.safeParse({
        courseId: OBJECT_ID,
        title: 'X',
        totalMarks: 999999,
      }).success,
    ).toBe(false);

    expect(
      createAssignmentSchema.safeParse({
        courseId: OBJECT_ID,
        title: 'X',
        weightage: 120,
      }).success,
    ).toBe(false);
  });

  it('requires ISO datetimes for scheduling fields', () => {
    expect(
      createAssignmentSchema.safeParse({
        courseId: OBJECT_ID,
        title: 'X',
        dueDate: '2026-13-45',
      }).success,
    ).toBe(false);

    expect(
      createAssignmentSchema.safeParse({
        courseId: OBJECT_ID,
        title: 'X',
        dueDate: '2026-08-07T10:00:00.000Z',
      }).success,
    ).toBe(true);
  });

  it('makes update partial and drops courseId', () => {
    const parsed = updateAssignmentSchema.parse({ title: 'Renamed' });
    expect(parsed.title).toBe('Renamed');
    expect('courseId' in parsed).toBe(false);
  });

  it('coerces and defaults list query pagination', () => {
    const parsed = assignmentListQuerySchema.parse({ page: '2', limit: '50' });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(50);
    expect(parsed.sortBy).toBe('createdAt');
    expect(parsed.sortOrder).toBe('desc');
  });

  it('transforms boolean-ish query flags into real booleans', () => {
    const parsed = assignmentListQuerySchema.parse({ published: 'true', late: 'false' });
    expect(parsed.published).toBe(true);
    expect(parsed.late).toBe(false);
  });

  it('caps list limit at 100', () => {
    expect(assignmentListQuerySchema.safeParse({ limit: '500' }).success).toBe(false);
  });

  it('accepts the documented due filters only', () => {
    expect(assignmentListQuerySchema.safeParse({ due: 'upcoming' }).success).toBe(true);
    expect(assignmentListQuerySchema.safeParse({ due: 'someday' }).success).toBe(false);
  });

  it('requires at least one rubric criterion', () => {
    expect(createRubricSchema.safeParse({ title: 'R', criteria: [] }).success).toBe(false);

    const parsed = createRubricSchema.parse({
      title: 'R',
      criteria: [{ title: 'Clarity', maxPoints: 10 }],
    });
    expect(parsed.reusable).toBe(true);
    expect(parsed.criteria[0]?.weight).toBe(0);
  });

  it('defaults submission payloads', () => {
    const parsed = submitAssignmentSchema.parse({ assignmentId: OBJECT_ID });
    expect(parsed.submissionType).toBe('mixed');
    expect(parsed.links).toEqual([]);
  });

  it('rejects malformed submission links', () => {
    expect(
      submitAssignmentSchema.safeParse({ assignmentId: OBJECT_ID, links: ['not-a-url'] }).success,
    ).toBe(false);
  });

  it('defaults grading to marks and no auto-return', () => {
    const parsed = gradeSubmissionSchema.parse({});
    expect(parsed.gradingMethod).toBe('marks');
    expect(parsed.returnToStudent).toBe(false);
    expect(parsed.rubricScores).toEqual([]);
  });

  it('rejects a percentage above 100', () => {
    expect(
      gradeSubmissionSchema.safeParse({ gradingMethod: 'percentage', percentage: 120 }).success,
    ).toBe(false);
  });

  it('requires a non-empty comment body', () => {
    expect(
      createCommentSchema.safeParse({ assignmentId: OBJECT_ID, body: '' }).success,
    ).toBe(false);
    expect(
      createCommentSchema.safeParse({ assignmentId: OBJECT_ID, body: 'Looks good' }).success,
    ).toBe(true);
  });

  it('allows only whitelisted upload content types', () => {
    expect(
      assignmentFileUploadSchema.safeParse({
        fileName: 'report.pdf',
        contentType: 'application/pdf',
        data: 'aGVsbG8=',
      }).success,
    ).toBe(true);

    expect(
      assignmentFileUploadSchema.safeParse({
        fileName: 'shell.sh',
        contentType: 'application/x-sh',
        data: 'aGVsbG8=',
      }).success,
    ).toBe(false);
  });

  it('caps uploads at 50MB of decoded bytes', () => {
    expect(ASSIGNMENT_MAX_FILE_BYTES).toBe(50 * 1024 * 1024);
  });

  it('filters submissions by graded/late flags', () => {
    const parsed = submissionListQuerySchema.parse({ graded: 'true', late: 'true' });
    expect(parsed.graded).toBe(true);
    expect(parsed.late).toBe(true);
    expect(parsed.page).toBe(1);
  });
});
