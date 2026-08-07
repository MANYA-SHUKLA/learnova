import { describe, expect, it } from 'vitest';
import {
  PROJECT_MAX_FILE_BYTES,
  createMilestoneSchema,
  createProjectSchema,
  createReviewSchema,
  createTeamSchema,
  gradeProjectSubmissionSchema,
  projectFileUploadSchema,
  projectListQuerySchema,
  saveSubmissionDraftSchema,
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

    expect(parsed.projectType).toBe('team');
    expect(parsed.visibility).toBe('enrolled');
    expect(parsed.totalMarks).toBe(100);
    expect(parsed.passingMarks).toBe(40);
    expect(parsed.allowPeerReview).toBe(false);
    expect(parsed.allowMilestones).toBe(true);
  });

  it('rejects invalid team size bounds', () => {
    expect(
      createProjectSchema.safeParse({
        courseId: OBJECT_ID,
        title: 'X',
        teamSizeMin: 10,
        teamSizeMax: 2,
      }).success,
    ).toBe(true);
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

  it('validates milestone creation', () => {
    const parsed = createMilestoneSchema.parse({
      projectId: OBJECT_ID,
      title: 'Design Review',
    });
    expect(parsed.weight).toBe(0);
  });

  it('validates team creation', () => {
    const parsed = createTeamSchema.parse({
      projectId: OBJECT_ID,
      name: 'Alpha Squad',
    });
    expect(parsed.name).toBe('Alpha Squad');
  });

  it('defaults submission payloads', () => {
    const parsed = submitProjectSchema.parse({ projectId: OBJECT_ID });
    expect(parsed.deliveryType).toBe('mixed');
    expect(parsed.links).toEqual([]);
  });

  it('defaults grading to marks with prepared gradebook flag implied by service', () => {
    const parsed = gradeProjectSubmissionSchema.parse({});
    expect(parsed.gradingMethod).toBe('marks');
    expect(parsed.returnToStudent).toBe(false);
  });

  it('validates peer review creation', () => {
    const parsed = createReviewSchema.parse({
      projectId: OBJECT_ID,
      submissionId: OBJECT_ID,
    });
    expect(parsed.reviewType).toBe('peer');
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
    const parsed = saveSubmissionDraftSchema.parse({ projectId: OBJECT_ID });
    expect(parsed.deliveryType).toBe('mixed');
    expect(parsed.repoLink).toBeNull();
  });
});
