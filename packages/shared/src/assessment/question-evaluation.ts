import type {
  EvaluableQuestion,
  EvaluatedQuestionAnswer,
  QuestionAnswerInput,
  QuestionAttemptScore,
  QuestionAttemptSettings,
} from '@learnova/types';

function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function evaluateSingleChoice(
  question: EvaluableQuestion,
  answer: QuestionAnswerInput,
  negativeMarking: boolean,
): EvaluatedQuestionAnswer {
  const selected = answer.selectedOptionIds;
  if (selected.length === 0) {
    return { questionId: question.id, isCorrect: null, marksAwarded: 0, skipped: true };
  }

  const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
  const isCorrect = selected.length === 1 && correctIds.has(selected[0]!);

  let marksAwarded = 0;
  if (isCorrect) {
    marksAwarded = question.marks;
  } else if (negativeMarking) {
    marksAwarded = -Math.min(question.negativeMarks, question.marks);
  }

  return { questionId: question.id, isCorrect, marksAwarded, skipped: false };
}

function evaluateMultipleChoice(
  question: EvaluableQuestion,
  answer: QuestionAnswerInput,
  negativeMarking: boolean,
): EvaluatedQuestionAnswer {
  const selected = new Set(answer.selectedOptionIds);
  if (selected.size === 0) {
    return { questionId: question.id, isCorrect: null, marksAwarded: 0, skipped: true };
  }

  const correctIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
  const selectedCorrect = correctIds.filter((id) => selected.has(id)).length;
  const selectedIncorrect = [...selected].filter((id) => !correctIds.includes(id)).length;

  const isCorrect =
    selectedCorrect === correctIds.length && selectedIncorrect === 0 && correctIds.length > 0;

  let marksAwarded = 0;
  if (isCorrect) {
    marksAwarded = question.marks;
  } else if (negativeMarking && selectedIncorrect > 0) {
    marksAwarded = -Math.min(question.negativeMarks * selectedIncorrect, question.marks);
  } else if (selectedCorrect > 0 && !negativeMarking) {
    marksAwarded = (question.marks * selectedCorrect) / Math.max(correctIds.length, 1);
  }

  return { questionId: question.id, isCorrect, marksAwarded, skipped: false };
}

function evaluateFillBlank(
  question: EvaluableQuestion,
  answer: QuestionAnswerInput,
  negativeMarking: boolean,
): EvaluatedQuestionAnswer {
  const text = answer.textAnswer?.trim();
  if (!text) {
    return { questionId: question.id, isCorrect: null, marksAwarded: 0, skipped: true };
  }

  const normalized = normalizeText(text);
  const isCorrect = question.fillBlankAnswers.some((a) => normalizeText(a) === normalized);

  let marksAwarded = 0;
  if (isCorrect) {
    marksAwarded = question.marks;
  } else if (negativeMarking) {
    marksAwarded = -Math.min(question.negativeMarks, question.marks);
  }

  return { questionId: question.id, isCorrect, marksAwarded, skipped: false };
}

function evaluateMatchFollowing(
  question: EvaluableQuestion,
  answer: QuestionAnswerInput,
  negativeMarking: boolean,
): EvaluatedQuestionAnswer {
  const pairs = question.matchPairs;
  if (pairs.length === 0) {
    return { questionId: question.id, isCorrect: null, marksAwarded: 0, skipped: true };
  }

  const answers = answer.matchAnswers ?? {};
  if (Object.keys(answers).length === 0) {
    return { questionId: question.id, isCorrect: null, marksAwarded: 0, skipped: true };
  }

  let correctCount = 0;
  for (const pair of pairs) {
    const submitted = answers[pair.left];
    if (submitted && normalizeText(submitted) === normalizeText(pair.right)) {
      correctCount += 1;
    }
  }

  const isCorrect = correctCount === pairs.length;
  let marksAwarded = 0;
  if (isCorrect) {
    marksAwarded = question.marks;
  } else if (correctCount > 0) {
    marksAwarded = (question.marks * correctCount) / pairs.length;
  } else if (negativeMarking) {
    marksAwarded = -Math.min(question.negativeMarks, question.marks);
  }

  return { questionId: question.id, isCorrect, marksAwarded, skipped: false };
}

/** Auto-evaluate a single question answer (MCQ, T/F, match, fill-blank). */
export function evaluateQuestionAnswer(
  question: EvaluableQuestion,
  answer: QuestionAnswerInput,
  negativeMarking: boolean,
): EvaluatedQuestionAnswer {
  switch (question.questionType) {
    case 'single_choice':
    case 'true_false':
      return evaluateSingleChoice(question, answer, negativeMarking);
    case 'multiple_choice':
    case 'assertion_reason':
      return evaluateMultipleChoice(question, answer, negativeMarking);
    case 'fill_blank':
      return evaluateFillBlank(question, answer, negativeMarking);
    case 'match_following':
      return evaluateMatchFollowing(question, answer, negativeMarking);
    default:
      return { questionId: question.id, isCorrect: null, marksAwarded: 0, skipped: true };
  }
}

/** Score a full question-based attempt and compute pass/fail. */
export function scoreQuestionAttempt(
  questions: EvaluableQuestion[],
  answers: QuestionAnswerInput[],
  settings: QuestionAttemptSettings,
): QuestionAttemptScore {
  const answerMap = new Map(answers.map((a) => [a.questionId, a]));
  const evaluated: EvaluatedQuestionAnswer[] = [];

  for (const question of questions) {
    const answer = answerMap.get(question.id) ?? {
      questionId: question.id,
      selectedOptionIds: [],
      textAnswer: null,
      matchAnswers: {},
    };
    evaluated.push(evaluateQuestionAnswer(question, answer, settings.negativeMarking));
  }

  const score = Math.max(0, evaluated.reduce((sum, item) => sum + item.marksAwarded, 0));
  const correct = evaluated.filter((e) => e.isCorrect === true).length;
  const incorrect = evaluated.filter((e) => e.isCorrect === false).length;
  const skipped = evaluated.filter((e) => e.skipped).length;
  const percentage =
    settings.totalMarks > 0 ? Math.min(100, (score / settings.totalMarks) * 100) : 0;
  const passed = score >= settings.passingMarks;

  return {
    evaluated,
    score,
    percentage,
    correct,
    incorrect,
    skipped,
    passed,
  };
}
