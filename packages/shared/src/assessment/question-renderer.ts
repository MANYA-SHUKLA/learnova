import type { RenderedAssessmentQuestion } from '@learnova/types';

export interface QuestionDocumentLike {
  _id: { toString(): string };
  question: string;
  description?: string | null;
  questionType: string;
  difficulty: string;
  marks: number;
  hint?: string | null;
  attachments?: unknown[];
  options?: Array<{
    id: string;
    optionText: string;
    displayOrder: number;
    isCorrect?: boolean;
  }>;
  matchPairs?: Array<{ id: string; left: string; right: string; displayOrder: number }>;
}

/** Strip correct answers and optionally shuffle options for a live attempt. */
export function renderQuestionForAttempt(
  doc: QuestionDocumentLike,
  options: { shuffleOptions: boolean; hideCorrectAnswers: boolean },
): RenderedAssessmentQuestion {
  let renderedOptions = (doc.options ?? []).map((o) => ({
    id: o.id,
    optionText: o.optionText,
    displayOrder: o.displayOrder,
  }));

  if (options.shuffleOptions) {
    renderedOptions = [...renderedOptions].sort(() => Math.random() - 0.5);
  }

  const matchPairs = (doc.matchPairs ?? []).map((p) => ({
    id: p.id,
    left: p.left,
    displayOrder: p.displayOrder,
  }));

  return {
    id: doc._id.toString(),
    question: doc.question,
    description: doc.description ?? null,
    questionType: doc.questionType as RenderedAssessmentQuestion['questionType'],
    difficulty: doc.difficulty,
    marks: doc.marks,
    hint: doc.hint ?? null,
    attachments: doc.attachments ?? [],
    options: renderedOptions,
    matchPairs,
  };
}

/** Render for post-attempt review with optional correct-answer reveal. */
export function renderQuestionForReview(
  doc: QuestionDocumentLike,
  options: { showCorrectAnswers: boolean },
): RenderedAssessmentQuestion & {
  options: Array<{ id: string; optionText: string; displayOrder: number; isCorrect?: boolean }>;
  matchPairs: Array<{ id: string; left: string; right: string; displayOrder: number }>;
} {
  const base = renderQuestionForAttempt(doc, {
    shuffleOptions: false,
    hideCorrectAnswers: !options.showCorrectAnswers,
  });

  return {
    ...base,
    options: (doc.options ?? []).map((o) => ({
      id: o.id,
      optionText: o.optionText,
      displayOrder: o.displayOrder,
      ...(options.showCorrectAnswers ? { isCorrect: o.isCorrect } : {}),
    })),
    matchPairs: doc.matchPairs ?? [],
  };
}

/** Select question IDs with section-level and quiz-level randomization. */
export function selectQuestionsForActivity(
  allQuestionIds: string[],
  sectionSpecs: Array<{
    questionIds: string[];
    randomizeQuestions: boolean;
    randomQuestionCount: number | null;
  }>,
  shuffleQuestions: boolean,
): string[] {
  const selected: string[] = [];

  if (sectionSpecs.length > 0) {
    for (const section of sectionSpecs) {
      let pool = [...section.questionIds];
      if (section.randomizeQuestions) {
        pool = pool.sort(() => Math.random() - 0.5);
      }
      const count = section.randomQuestionCount ?? pool.length;
      selected.push(...pool.slice(0, count));
    }
  } else {
    let pool = [...allQuestionIds];
    if (shuffleQuestions) {
      pool = pool.sort(() => Math.random() - 0.5);
    }
    selected.push(...pool);
  }

  return [...new Set(selected)];
}
