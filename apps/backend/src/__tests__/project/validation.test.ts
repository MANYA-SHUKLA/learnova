import { describe, expect, it } from 'vitest';
import {
  PROJECT_MAX_FILE_BYTES,
  bulkAssignFacultySchema,
  bulkProjectIdsSchema,
  createMilestoneSchema,
  createProjectSchema,
  createReviewSchema,
  createTeamSchema,
  gradeProjectSubmissionSchema,
  projectFileUploadSchema,
  projectListQuerySchema,
  saveProjectSubmissionDraftSchema,
  submitProjectSchema,
  updateProjectSchema,
} from '@learnova/validation';

const OBJECT_ID = '507f1f77bcf86cd799439011';

describe('project validation', () => {
  it('applies defaults when creating a project', () => {
    const parsed = createProjectSchema.parse({
      courseId: OBJECT_ID,
      title: 'Capstone Build',
    });

    expect(parsed.projectType).toBe('major_project');
    expect(parsed.visibility).toBe('enrolled');
    expect(parsed.totalMarks).toBe(100);
    expect(parsed.passingMarks).toBe(40);
    expect(parsed.allowPeerReview).toBe(false);
    expect(parsed.allowMilestones).toBe(true);
    expect(parsed.difficulty).toBe('intermediate');
  });

  it('rejects a non-ObjectId courseId', () => {
    expect(createProjectSchema.safeParse({ courseId: 'nope', title: 'X' }).success).toBe(false);
  });

  it('makes update partial and drops courseId', () => {
    const parsed = updateProjectSchema.parse({ title: 'Renamed' });
    expect(parsed.title).toBe('Renamed');
    expect('courseId' in parsed).toBe(false);
  });

  it('coerces list query pagination', () => {
    const parsed = projectListQuerySchema.parse({ page: '2', limit: '50' });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(50);
  });

  it('validates milestone creation with weightage', () => {
    const parsed = createMilestoneSchema.parse({
      projectId: OBJECT_ID,
      title: 'Design Review',
    });
    expect(parsed.weightage).toBe(0);
    expect(parsed.milestoneType).toBe('custom');
  });

  it('validates team creation with teamName', () => {
    const parsed = createTeamSchema.parse({
      projectId: OBJECT_ID,
      teamName: 'Alpha Squad',
    });
    expect(parsed.teamName).toBe('Alpha Squad');
  });

  it('defaults submission payloads with new field names', () => {
    const parsed = submitProjectSchema.parse({ projectId: OBJECT_ID });
    expect(parsed.deliveryType).toBe('mixed');
    expect(parsed.links).toEqual([]);
    expect(parsed.submissionText).toBeUndefined();
  });

  it('defaults grading to marks with prepared gradebook flag implied by service', () => {
    const parsed = gradeProjectSubmissionSchema.parse({});
    expect(parsed.gradingMethod).toBe('marks');
    expect(parsed.returnToStudent).toBe(false);
  });

  it('validates faculty review creation with score fields', () => {
    const parsed = createReviewSchema.parse({
      projectId: OBJECT_ID,
      submissionId: OBJECT_ID,
    });
    expect(parsed.reviewType).toBe('faculty');
    expect(parsed.revisionRequired).toBe(false);
  });

  it('allows whitelisted upload content types', () => {
    expect(
      projectFileUploadSchema.safeParse({
        fileName: 'report.pdf',
        contentType: 'application/pdf',
        data: 'aGVsbG8=',
      }).success,
    ).toBe(true);
  });

  it('caps uploads at 50MB of decoded bytes', () => {
    expect(PROJECT_MAX_FILE_BYTES).toBe(50 * 1024 * 1024);
  });

  it('defaults draft submission fields', () => {
    const parsed = saveProjectSubmissionDraftSchema.parse({ projectId: OBJECT_ID });
    expect(parsed.deliveryType).toBe('mixed');
    expect(parsed.githubRepository).toBeUndefined();
  });

  it('validates bulk project ids payload', () => {
    const parsed = bulkProjectIdsSchema.parse({ projectIds: [OBJECT_ID] });
    expect(parsed.projectIds).toHaveLength(1);
  });

  it('validates bulk assign faculty payload', () => {
    const parsed = bulkAssignFacultySchema.parse({
      projectIds: [OBJECT_ID],
      facultyIds: [OBJECT_ID],
    });
    expect(parsed.facultyIds).toHaveLength(1);
  });
});
