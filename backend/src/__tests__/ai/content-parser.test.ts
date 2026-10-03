import { describe, expect, it } from 'vitest';
import {
  applyTeacherQuizRules,
  parseBlueprintProposal,
  parseOutlineProposal,
  parseQuizProposal,
  renderLessonHtml,
} from '@learnova/validation';

const outlineFixture = {
  modules: [
    {
      title: 'Sorting',
      description: 'Order data',
      lessons: [
        {
          title: 'Merge sort',
          summary: 'Split and merge sorted halves.',
          bullets: ['Divide the list', 'Merge in order'],
        },
      ],
    },
  ],
};

describe('AI content parsers', () => {
  it('keeps a valid outline', () => {
    const parsed = parseOutlineProposal(outlineFixture, { moduleCount: 5, lessonsPerModule: 3 });
    expect(parsed?.modules).toHaveLength(1);
    expect(parsed?.modules[0]?.lessons[0]?.title).toBe('Merge sort');
  });

  it('drops an invalid quiz question and keeps five valid ones', () => {
    const valid = {
      question: 'What is 2 + 2?',
      questionType: 'single_choice',
      difficulty: 'easy',
      marks: 1,
      explanation: 'Four',
      options: [
        { optionText: '3', isCorrect: false },
        { optionText: '4', isCorrect: true },
        { optionText: '5', isCorrect: false },
        { optionText: '6', isCorrect: false },
      ],
    };
    const parsed = parseQuizProposal({
      title: 'Practice',
      questions: [
        valid,
        { ...valid, question: 'Second' },
        { ...valid, question: 'Third' },
        { ...valid, question: 'Fourth' },
        { ...valid, question: 'Fifth' },
        { questionType: 'match_following', question: 'Bad', options: [] },
      ],
    });
    expect(parsed?.questions).toHaveLength(5);
    expect(parsed?.questions.map((question) => question.question)).not.toContain('Bad');
  });

  it('rescales blueprint slots so marks add up to the total', () => {
    const parsed = parseBlueprintProposal(
      {
        name: 'Midterm',
        description: 'Core topics',
        slots: [
          { difficulty: 'easy', category: 'Basics', marks: 2, count: 5 },
          { difficulty: 'hard', category: 'Graphs', marks: 10, count: 2 },
        ],
      },
      { totalMarks: 100, durationMinutes: 120, fallbackName: 'Exam' },
    );
    expect(parsed).not.toBeNull();
    const total = (parsed?.slots ?? []).reduce((sum, slot) => sum + slot.marks * slot.count, 0);
    expect(total).toBeCloseTo(100, 1);
    expect(parsed?.totalMarks).toBe(100);
  });

  it('rejects a blueprint with no usable slots', () => {
    const parsed = parseBlueprintProposal(
      { slots: [] },
      { totalMarks: 100, durationMinutes: 90, fallbackName: 'Exam' },
    );
    expect(parsed).toBeNull();
  });

  it('applies the teacher marks and negative marks to every question', () => {
    const shaped = applyTeacherQuizRules(
      {
        title: 'Stacks',
        questions: [
          {
            question: 'A stack is last in, first out.',
            questionType: 'true_false',
            difficulty: 'easy',
            marks: 1,
            negativeMarks: 0,
            explanation: '',
            options: [
              { optionText: 'True', isCorrect: true },
              { optionText: 'False', isCorrect: false },
            ],
          },
        ],
      },
      { marks: 2, negativeMarks: 0.5 },
    );
    expect(shaped.questions[0]?.marks).toBe(2);
    expect(shaped.questions[0]?.negativeMarks).toBe(0.5);
  });

  it('escapes lesson text into simple HTML', () => {
    const html = renderLessonHtml({
      summary: 'Use <p> tags carefully',
      bullets: ['A & B'],
    });
    expect(html).toContain('&lt;p&gt;');
    expect(html).toContain('A &amp; B');
    expect(html.startsWith('<p>')).toBe(true);
  });
});
