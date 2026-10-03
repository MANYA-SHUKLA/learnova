import { z } from 'zod';
import { REGEX } from '@learnova/constants';

const objectIdField = z.string().regex(REGEX.OBJECT_ID, 'Invalid ObjectId');

export const aiCourseParamsSchema = z.object({
  courseId: objectIdField,
});

const teacherBriefFields = {
  topics: z.string().trim().max(2000).optional().default(''),
  instructions: z.string().trim().max(4000).optional().default(''),
};

export const generateOutlineSchema = z.object({
  moduleCount: z.number().int().min(1).max(8).default(5),
  lessonsPerModule: z.number().int().min(1).max(4).default(3),
  ...teacherBriefFields,
});

export const generateQuizSchema = z.object({
  questionCount: z.number().int().min(5).max(20).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
  marks: z.number().min(0).max(100).optional(),
  negativeMarks: z.number().min(0).max(100).default(0),
  ...teacherBriefFields,
});

export const generateBlueprintSchema = z.object({
  totalMarks: z.number().min(1).max(10000).default(100),
  durationMinutes: z.number().int().min(1).max(600).default(120),
  negativeMarks: z.number().min(0).max(100).default(0),
  ...teacherBriefFields,
});

export const aiLessonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  summary: z.string().trim().min(1).max(1000),
  bullets: z.array(z.string().trim().min(1).max(500)).min(1).max(8),
});

export const aiModuleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().default(''),
  lessons: z.array(aiLessonSchema).min(1).max(4),
});

export const aiOutlineProposalSchema = z.object({
  modules: z.array(aiModuleSchema).min(1).max(8),
});

const aiQuestionTypeSchema = z.enum(['single_choice', 'multiple_choice', 'true_false']);

export const aiQuestionOptionSchema = z.object({
  optionText: z.string().trim().min(1).max(2000),
  isCorrect: z.boolean(),
});

export const aiQuestionSchema = z
  .object({
    question: z.string().trim().min(1).max(10000),
    questionType: aiQuestionTypeSchema,
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    marks: z.number().min(0).max(100).default(1),
    negativeMarks: z.number().min(0).max(100).default(0),
    explanation: z.string().trim().max(5000).optional().default(''),
    options: z.array(aiQuestionOptionSchema).min(2).max(6),
  })
  .superRefine((value, ctx) => {
    const correct = value.options.filter((option) => option.isCorrect).length;
    if (value.questionType === 'true_false') {
      if (value.options.length !== 2 || correct !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'True/false needs two options and one answer' });
      }
      return;
    }
    if (value.options.length !== 4) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Choice questions need four options' });
    }
    if (value.questionType === 'single_choice' && correct !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Single choice needs one correct option' });
    }
    if (value.questionType === 'multiple_choice' && correct < 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Multiple choice needs a correct option' });
    }
  });

export const aiQuizProposalSchema = z.object({
  title: z.string().trim().min(1).max(200),
  questions: z.array(aiQuestionSchema).min(5).max(20),
});

export const aiBlueprintSlotSchema = z.object({
  difficulty: z.string().trim().max(32).optional().nullable(),
  category: z.string().trim().max(120).optional().nullable(),
  marks: z.number().min(0),
  count: z.number().int().min(1).max(200),
});

export const aiBlueprintProposalSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().default(''),
  totalMarks: z.number().min(1).max(10000),
  durationMinutes: z.number().int().min(1).max(600).default(120),
  slots: z.array(aiBlueprintSlotSchema).min(1).max(50),
});

export const acceptOutlineSchema = aiOutlineProposalSchema;

export const acceptQuizSchema = aiQuizProposalSchema.extend({
  questionBankId: objectIdField.optional(),
});

export const acceptBlueprintSchema = aiBlueprintProposalSchema.extend({
  questionPoolIds: z.array(objectIdField).max(500).optional().default([]),
  examId: objectIdField.optional(),
});

export type GenerateOutlineInput = z.infer<typeof generateOutlineSchema>;
export type GenerateQuizInput = z.infer<typeof generateQuizSchema>;
export type GenerateBlueprintInput = z.infer<typeof generateBlueprintSchema>;
export type AiLessonProposal = z.infer<typeof aiLessonSchema>;
export type AiModuleProposal = z.infer<typeof aiModuleSchema>;
export type AiOutlineProposal = z.infer<typeof aiOutlineProposalSchema>;
export type AiQuestionProposal = z.infer<typeof aiQuestionSchema>;
export type AiQuizProposal = z.infer<typeof aiQuizProposalSchema>;

export function applyTeacherQuizRules(
  proposal: AiQuizProposal,
  rules: { marks?: number; negativeMarks: number },
): AiQuizProposal {
  return {
    ...proposal,
    questions: proposal.questions.map((question) => ({
      ...question,
      marks: rules.marks ?? question.marks,
      negativeMarks: rules.negativeMarks,
    })),
  };
}
export type AiBlueprintSlot = z.infer<typeof aiBlueprintSlotSchema>;
export type AiBlueprintProposal = z.infer<typeof aiBlueprintProposalSchema>;
export type AcceptOutlineInput = z.infer<typeof acceptOutlineSchema>;
export type AcceptQuizInput = z.infer<typeof acceptQuizSchema>;
export type AcceptBlueprintInput = z.infer<typeof acceptBlueprintSchema>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function field(row: Record<string, unknown>, key: string): unknown {
  return row[key];
}

function arrayField(row: Record<string, unknown> | null, key: string): unknown[] {
  if (!row) return [];
  const value = field(row, key);
  return Array.isArray(value) ? value : [];
}

function coerceQuestion(raw: unknown): unknown {
  const row = asRecord(raw);
  if (!row) return raw;
  const options = Array.isArray(field(row, 'options'))
    ? (field(row, 'options') as unknown[]).map((option) => {
        const item = asRecord(option);
        if (!item) return option;
        return {
          optionText: field(item, 'optionText') ?? field(item, 'text') ?? field(item, 'label') ?? '',
          isCorrect: Boolean(field(item, 'isCorrect') ?? field(item, 'correct')),
        };
      })
    : [];
  return {
    question: field(row, 'question') ?? field(row, 'stem') ?? field(row, 'prompt') ?? '',
    questionType: field(row, 'questionType') ?? field(row, 'type'),
    difficulty: field(row, 'difficulty') ?? 'medium',
    marks: field(row, 'marks') ?? 1,
    explanation: field(row, 'explanation') ?? '',
    options,
  };
}

export function parseOutlineProposal(
  raw: unknown,
  limits: { moduleCount?: number; lessonsPerModule?: number } = {},
): AiOutlineProposal | null {
  const row = asRecord(raw);
  const modulesRaw = arrayField(row, 'modules');
  const moduleCap = limits.moduleCount ?? 8;
  const lessonCap = limits.lessonsPerModule ?? 4;
  const modules: AiModuleProposal[] = [];

  for (const item of modulesRaw) {
    const moduleRow = asRecord(item);
    if (!moduleRow) continue;
    const lessonsRaw = arrayField(moduleRow, 'lessons');
    const lessons: AiLessonProposal[] = [];
    for (const lesson of lessonsRaw) {
      const parsed = aiLessonSchema.safeParse(lesson);
      if (parsed.success) lessons.push(parsed.data);
      if (lessons.length >= lessonCap) break;
    }
    if (lessons.length === 0) continue;
    const parsedModule = aiModuleSchema.safeParse({ ...moduleRow, lessons });
    if (parsedModule.success) modules.push(parsedModule.data);
    if (modules.length >= moduleCap) break;
  }

  if (modules.length === 0) return null;
  return { modules };
}

export function parseQuizProposal(
  raw: unknown,
  limits: { questionCount?: number; fallbackTitle?: string } = {},
): AiQuizProposal | null {
  const row = asRecord(raw);
  const questionsRaw = arrayField(row, 'questions');
  const cap = limits.questionCount ?? 20;
  const questions: AiQuestionProposal[] = [];

  for (const item of questionsRaw) {
    const parsed = aiQuestionSchema.safeParse(coerceQuestion(item));
    if (!parsed.success) continue;
    questions.push(parsed.data);
    if (questions.length >= cap) break;
  }

  if (questions.length < 5) return null;
  const titleValue = row ? field(row, 'title') : undefined;
  const title =
    typeof titleValue === 'string' && titleValue.trim().length > 0
      ? titleValue.trim().slice(0, 200)
      : (limits.fallbackTitle ?? 'Practice quiz');
  const proposal = aiQuizProposalSchema.safeParse({ title, questions });
  return proposal.success ? proposal.data : null;
}

export function rescaleBlueprintSlots(
  slots: AiBlueprintSlot[],
  totalMarks: number,
): AiBlueprintSlot[] | null {
  if (slots.length === 0 || totalMarks <= 0) return null;
  const current = slots.reduce((sum, slot) => sum + slot.marks * slot.count, 0);
  if (current <= 0) return null;

  const scaled = slots.map((slot) => ({ ...slot }));
  if (Math.abs(current - totalMarks) > 0.001) {
    const factor = totalMarks / current;
    for (const slot of scaled.slice(0, -1)) {
      slot.marks = Math.round(slot.marks * factor * 100) / 100;
    }
    const others = scaled
      .slice(0, -1)
      .reduce((sum, slot) => sum + slot.marks * slot.count, 0);
    const last = scaled.at(-1);
    if (!last) return null;
    last.marks = Math.round(((totalMarks - others) / last.count) * 100) / 100;
  }

  if (scaled.some((slot) => slot.marks < 0)) return null;
  const total = scaled.reduce((sum, slot) => sum + slot.marks * slot.count, 0);
  if (Math.abs(total - totalMarks) > 0.05) return null;
  return scaled;
}

export function parseBlueprintProposal(
  raw: unknown,
  defaults: { totalMarks: number; durationMinutes: number; fallbackName: string },
): AiBlueprintProposal | null {
  const row = asRecord(raw);
  const slotsRaw = arrayField(row, 'slots');
  const slots: AiBlueprintSlot[] = [];
  for (const item of slotsRaw) {
    const slot = asRecord(item);
    if (!slot) continue;
    const parsed = aiBlueprintSlotSchema.safeParse({
      difficulty: field(slot, 'difficulty') ?? 'medium',
      category: field(slot, 'category') ?? field(slot, 'topic') ?? null,
      marks: field(slot, 'marks') ?? 1,
      count: field(slot, 'count') ?? field(slot, 'questionCount'),
    });
    if (parsed.success) slots.push(parsed.data);
  }

  const scaled = rescaleBlueprintSlots(slots, defaults.totalMarks);
  if (!scaled) return null;

  const nameValue = row ? field(row, 'name') : undefined;
  const name =
    typeof nameValue === 'string' && nameValue.trim().length > 0
      ? nameValue.trim().slice(0, 120)
      : defaults.fallbackName;
  const descriptionValue = row ? field(row, 'description') : undefined;
  const description =
    typeof descriptionValue === 'string' ? descriptionValue.trim().slice(0, 2000) : '';

  const proposal = aiBlueprintProposalSchema.safeParse({
    name,
    description,
    totalMarks: defaults.totalMarks,
    durationMinutes: defaults.durationMinutes,
    slots: scaled,
  });
  return proposal.success ? proposal.data : null;
}

export function renderLessonHtml(lesson: Pick<AiLessonProposal, 'summary' | 'bullets'>): string {
  const escape = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  const items = lesson.bullets.map((bullet) => `<li>${escape(bullet)}</li>`).join('');
  return `<p>${escape(lesson.summary)}</p><h2>Outline</h2><ul>${items}</ul>`;
}
