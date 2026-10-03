import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createModule, createLesson, publishQuiz, findOne } = vi.hoisted(() => ({
  createModule: vi.fn(),
  createLesson: vi.fn(),
  publishQuiz: vi.fn(),
  findOne: vi.fn(),
}));

vi.mock('../../models/course.model.js', () => ({
  CourseModel: { findOne },
}));

vi.mock('../../models/course-module.model.js', () => ({
  CourseModuleModel: { find: vi.fn() },
}));

vi.mock('../../models/question-bank.model.js', () => ({
  QuestionBankModel: { findOne: vi.fn() },
}));

vi.mock('../../services/access/faculty-scope.js', () => ({
  facultyCanAccessCourse: vi.fn(),
}));

vi.mock('../../services/course-builder/course-builder.service.js', () => ({
  courseBuilderService: { createModule, createLesson },
}));

vi.mock('../../services/quiz/quiz.service.js', () => ({
  quizService: {
    publish: publishQuiz,
    create: vi.fn(),
    createQuestion: vi.fn(),
    createQuestionBank: vi.fn(),
  },
}));

vi.mock('../../services/examination/examination.service.js', () => ({
  examinationService: { createBlueprint: vi.fn(), applyBlueprint: vi.fn() },
}));

vi.mock('../../services/ai/gemini.client.js', () => ({
  generateGeminiJson: vi.fn(),
}));

import { contentGeneratorService } from '../../services/ai/content-generator.service.js';

const COURSE_ID = '507f1f77bcf86cd799439011';

describe('accept outline', () => {
  beforeEach(() => {
    createModule.mockReset();
    createLesson.mockReset();
    publishQuiz.mockReset();
    findOne.mockReset();
    findOne.mockReturnValue({
      exec: () =>
        Promise.resolve({
        _id: COURSE_ID,
        title: 'Algorithms',
        courseCode: 'CS101',
        description: 'Sorting and graphs',
        shortDescription: '',
        learningObjectives: ['Sort data'],
        outcomes: [],
        prerequisites: [],
        requirements: [],
        skills: [],
        difficulty: 'beginner',
        credits: 3,
      }),
    });
    createModule.mockResolvedValue({ id: 'module-1' });
    createLesson.mockResolvedValue({ id: 'lesson-1' });
  });

  it('saves draft lessons and does not publish', async () => {
    const result = await contentGeneratorService.acceptOutline(
      COURSE_ID,
      {
        modules: [
          {
            title: 'Sorting',
            description: 'Order data',
            lessons: [
              {
                title: 'Merge sort',
                summary: 'Split and merge sorted halves.',
                bullets: ['Divide the list'],
              },
            ],
          },
        ],
      },
      {
        userId: 'user-1',
        email: 'faculty@example.com',
        institutionId: '507f1f77bcf86cd799439012',
        role: 'institution_admin',
      },
    );

    expect(createModule).toHaveBeenCalledWith(
      COURSE_ID,
      expect.objectContaining({ title: 'Sorting', status: 'draft' }),
      expect.objectContaining({ role: 'institution_admin' }),
    );
    expect(createLesson).toHaveBeenCalledWith(
      COURSE_ID,
      expect.objectContaining({
        moduleId: 'module-1',
        status: 'draft',
        lessonType: 'rich_text',
      }),
      expect.any(Object),
    );
    const lessonInput = createLesson.mock.calls[0]?.[1] as { content: string };
    expect(lessonInput.content).toContain('<p>');
    expect(publishQuiz).not.toHaveBeenCalled();
    expect(result.lessonIds).toEqual(['lesson-1']);
    expect(result.builderPath).toBe(`/institution/courses/${COURSE_ID}/builder`);
  });
});
