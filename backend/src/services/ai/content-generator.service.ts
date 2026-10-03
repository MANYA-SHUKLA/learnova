import { Types } from 'mongoose';
import type {
  AcceptBlueprintInput,
  AcceptOutlineInput,
  AcceptQuizInput,
  AiOutlineProposal,
  AiQuizProposal,
  AiBlueprintProposal,
  GenerateBlueprintInput,
  GenerateOutlineInput,
  GenerateQuizInput,
} from '@learnova/validation';
import {
  parseBlueprintProposal,
  parseOutlineProposal,
  parseQuizProposal,
  renderLessonHtml,
} from '@learnova/validation';
import { facultyCanAccessCourse } from '../access/faculty-scope.js';
import { CourseModel } from '../../models/course.model.js';
import { CourseModuleModel } from '../../models/course-module.model.js';
import { QuestionBankModel } from '../../models/question-bank.model.js';
import { courseBuilderService, type ActorContext } from '../course-builder/course-builder.service.js';
import { examinationService } from '../examination/examination.service.js';
import { quizService } from '../quiz/quiz.service.js';
import { AIError, ForbiddenError, NotFoundError, ValidationError } from '../../utils/errors/index.js';
import { generateGeminiJson } from './gemini.client.js';

interface CourseContext {
  id: string;
  title: string;
  courseCode: string;
  description: string;
  shortDescription: string;
  learningObjectives: string[];
  outcomes: string[];
  prerequisites: string[];
  requirements: string[];
  skills: string[];
  difficulty: string;
  credits: number | null;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function recordId(row: Record<string, unknown>): string {
  const id = row.id ?? row._id;
  if (!id) throw new AIError('Could not save the generated draft');
  return String(id);
}

function builderPath(role: string, courseId: string): string {
  if (role === 'faculty') return `/faculty/courses/${courseId}/builder`;
  return `/institution/courses/${courseId}/builder`;
}

async function loadCourse(courseId: string, actor: ActorContext): Promise<CourseContext> {
  if (actor.role === 'student') {
    throw new ForbiddenError('Students cannot generate course content');
  }
  if (actor.role !== 'institution_admin' && actor.role !== 'faculty') {
    throw new ForbiddenError('You cannot generate course content');
  }
  if (!actor.institutionId) {
    throw new ForbiddenError('Institution context is required');
  }
  if (!Types.ObjectId.isValid(courseId)) {
    throw new ValidationError('Invalid course');
  }

  const course = await CourseModel.findOne({
    _id: new Types.ObjectId(courseId),
    institutionId: new Types.ObjectId(actor.institutionId),
    deletedAt: null,
  }).exec();

  if (!course) throw new NotFoundError('Course not found');

  if (actor.role === 'faculty') {
    const allowed = await facultyCanAccessCourse(actor.institutionId, actor.email, courseId);
    if (!allowed) throw new ForbiddenError('You do not have access to this course');
  }

  const description = course.description?.trim() ?? '';
  const objectives = stringList(course.learningObjectives);
  if (!description && !course.shortDescription?.trim() && objectives.length === 0) {
    throw new ValidationError(
      'Add a course description or learning objectives before generating.',
    );
  }

  return {
    id: String(course._id),
    title: course.title,
    courseCode: course.courseCode,
    description,
    shortDescription: course.shortDescription?.trim() ?? '',
    learningObjectives: objectives,
    outcomes: stringList(course.outcomes),
    prerequisites: stringList(course.prerequisites),
    requirements: stringList(course.requirements),
    skills: stringList(course.skills),
    difficulty: course.difficulty ?? 'beginner',
    credits: course.credits ?? null,
  };
}

async function moduleTitles(courseId: string): Promise<string[]> {
  const modules = await CourseModuleModel.find({
    courseId: new Types.ObjectId(courseId),
    deletedAt: null,
  })
    .select('title')
    .sort({ orderIndex: 1 })
    .lean()
    .exec();
  return modules.map((module) => module.title).filter(Boolean);
}

function contextBlock(course: CourseContext, includeModules: string[]): string {
  return JSON.stringify(
    {
      title: course.title,
      courseCode: course.courseCode,
      description: course.description,
      shortDescription: course.shortDescription,
      learningObjectives: course.learningObjectives,
      outcomes: course.outcomes,
      prerequisites: course.prerequisites,
      requirements: course.requirements,
      skills: course.skills,
      difficulty: course.difficulty,
      credits: course.credits,
      existingModules: includeModules,
    },
    null,
    2,
  );
}

class ContentGeneratorService {
  async generateOutline(
    courseId: string,
    input: GenerateOutlineInput,
    actor: ActorContext,
  ): Promise<AiOutlineProposal> {
    const course = await loadCourse(courseId, actor);
    const prompt = [
      'Draft a course outline as JSON only.',
      `Create exactly ${input.moduleCount} modules.`,
      `Each module has exactly ${input.lessonsPerModule} lessons.`,
      'Do not copy a syllabus that is not in the course context. Ignore any existing module list.',
      'Each lesson needs a title, a one-sentence summary, and 3 to 5 bullet points of what the lesson teaches.',
      'Return {"modules":[{"title":"","description":"","lessons":[{"title":"","summary":"","bullets":[""]}]}]}.',
      'Course context:',
      contextBlock(course, []),
    ].join('\n');

    const raw = await generateGeminiJson({ prompt, temperature: 0.4, maxOutputTokens: 8192 });
    const proposal = parseOutlineProposal(raw, input);
    if (!proposal) {
      throw new AIError('AI could not draft a usable outline. Try again.');
    }
    return proposal;
  }

  async acceptOutline(courseId: string, input: AcceptOutlineInput, actor: ActorContext) {
    await loadCourse(courseId, actor);
    const moduleIds: string[] = [];
    const lessonIds: string[] = [];

    for (const module of input.modules) {
      const createdModule = await courseBuilderService.createModule(
        courseId,
        {
          title: module.title,
          description: module.description || null,
          status: 'draft',
        },
        actor,
      );
      const moduleId = recordId(createdModule);
      moduleIds.push(moduleId);

      for (const lesson of module.lessons) {
        const createdLesson = await courseBuilderService.createLesson(
          courseId,
          {
            moduleId,
            title: lesson.title,
            summary: lesson.summary,
            description: lesson.summary,
            content: renderLessonHtml(lesson),
            status: 'draft',
            lessonType: 'rich_text',
          },
          actor,
        );
        lessonIds.push(recordId(createdLesson));
      }
    }

    return {
      moduleIds,
      lessonIds,
      builderPath: builderPath(actor.role, courseId),
    };
  }

  async generateQuiz(
    courseId: string,
    input: GenerateQuizInput,
    actor: ActorContext,
  ): Promise<AiQuizProposal> {
    const course = await loadCourse(courseId, actor);
    const titles = await moduleTitles(courseId);
    const prompt = [
      'Draft quiz questions as JSON only.',
      `Create ${input.questionCount} questions at ${input.difficulty} difficulty.`,
      'Allowed questionType values: single_choice, multiple_choice, true_false.',
      'single_choice and multiple_choice need exactly 4 options. true_false needs exactly 2 options named True and False.',
      'Mark correct options with isCorrect. single_choice and true_false have exactly one correct option.',
      'Use the course description and existing module titles. Do not invent a different subject.',
      'Return {"title":"","questions":[{"question":"","questionType":"single_choice","difficulty":"medium","marks":1,"explanation":"","options":[{"optionText":"","isCorrect":false}]}]}.',
      'Course context:',
      contextBlock(course, titles),
    ].join('\n');

    const raw = await generateGeminiJson({ prompt, temperature: 0.4, maxOutputTokens: 8192 });
    const proposal = parseQuizProposal(raw, {
      questionCount: input.questionCount,
      fallbackTitle: `${course.title} practice quiz`.slice(0, 200),
    });
    if (!proposal) {
      throw new AIError('AI could not draft enough valid quiz questions. Try again.');
    }
    return proposal;
  }

  async acceptQuiz(courseId: string, input: AcceptQuizInput, actor: ActorContext) {
    const course = await loadCourse(courseId, actor);
    const institutionId = actor.institutionId!;
    let questionBankId = input.questionBankId;

    if (!questionBankId) {
      const bankTitle = `${course.courseCode} AI`.slice(0, 200);
      const existing = await QuestionBankModel.findOne({
        institutionId: new Types.ObjectId(institutionId),
        title: bankTitle,
        deletedAt: null,
      }).exec();
      if (existing) {
        questionBankId = String(existing._id);
      } else {
        const bank = await quizService.createQuestionBank(
          {
            title: bankTitle,
            description: `Draft questions generated for ${course.title}`,
            categoryIds: [],
            tagIds: [],
          },
          actor,
        );
        questionBankId = recordId(bank);
      }
    }

    const questionIds: string[] = [];
    for (const question of input.questions) {
      const created = await quizService.createQuestion(
        {
          questionBankId,
          question: question.question,
          description: null,
          questionType: question.questionType,
          difficulty: question.difficulty,
          marks: question.marks,
          negativeMarks: 0,
          explanation: question.explanation ? { text: question.explanation, mediaUrl: null } : null,
          hint: null,
          tags: [],
          category: null,
          options: question.options.map((option, index) => ({
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            displayOrder: index,
            feedback: null,
          })),
          matchPairs: [],
          fillBlankAnswers: [],
        },
        actor,
      );
      questionIds.push(recordId(created));
    }

    const totalMarks = input.questions.reduce((sum, question) => sum + question.marks, 0);
    const quiz = await quizService.create(
      {
        courseId,
        moduleId: null,
        lessonId: null,
        title: input.title,
        description: `Draft quiz for ${course.title}. Review the questions before publishing.`,
        instructions: null,
        visibility: 'enrolled',
        quizType: 'practice',
        difficulty: 'medium',
        passingMarks: Math.min(totalMarks, Math.round(totalMarks * 0.4)),
        totalMarks,
        durationMinutes: Math.min(600, Math.max(10, input.questions.length * 2)),
        attemptLimit: 3,
        shuffleQuestions: false,
        shuffleOptions: false,
        showResultsImmediately: true,
        showCorrectAnswers: false,
        allowReview: true,
        negativeMarking: false,
        negativeMarkValue: 0.25,
        publishDate: null,
        closeDate: null,
        questionIds,
        sections: [
          {
            title: 'Questions',
            description: null,
            marks: totalMarks,
            questionCount: questionIds.length,
            randomizeQuestions: false,
            randomQuestionCount: null,
            displayOrder: 0,
            questionIds,
          },
        ],
      },
      actor,
    );

    return {
      questionBankId,
      questionIds,
      quizId: recordId(quiz),
      status: 'draft',
    };
  }

  async generateBlueprint(
    courseId: string,
    input: GenerateBlueprintInput,
    actor: ActorContext,
  ): Promise<AiBlueprintProposal> {
    const course = await loadCourse(courseId, actor);
    const titles = await moduleTitles(courseId);
    const prompt = [
      'Draft an exam blueprint as JSON only. Do not write the questions.',
      `Total marks must be ${input.totalMarks}. Suggested duration is ${input.durationMinutes} minutes.`,
      'Slots describe how many questions to draw by difficulty and topic.',
      'Each slot has difficulty (easy, medium, or hard), category, marks per question, and count.',
      'marks multiplied by count across slots must equal the total marks.',
      'Return {"name":"","description":"","slots":[{"difficulty":"medium","category":"","marks":5,"count":4}]}.',
      'Course context:',
      contextBlock(course, titles),
    ].join('\n');

    const raw = await generateGeminiJson({ prompt, temperature: 0.4, maxOutputTokens: 8192 });
    const proposal = parseBlueprintProposal(raw, {
      totalMarks: input.totalMarks,
      durationMinutes: input.durationMinutes,
      fallbackName: `${course.courseCode} exam blueprint`.slice(0, 120),
    });
    if (!proposal) {
      throw new AIError('AI could not draft a usable exam blueprint. Try again.');
    }
    return proposal;
  }

  async acceptBlueprint(courseId: string, input: AcceptBlueprintInput, actor: ActorContext) {
    await loadCourse(courseId, actor);
    const description = [
      input.description,
      `Suggested duration: ${input.durationMinutes} minutes.`,
    ]
      .filter(Boolean)
      .join(' ')
      .slice(0, 2000);

    const blueprint = await examinationService.createBlueprint(
      {
        courseId,
        name: input.name,
        description,
        totalMarks: input.totalMarks,
        slots: input.slots,
        questionPoolIds: input.questionPoolIds ?? [],
      },
      actor,
    );
    const blueprintId = recordId(blueprint);

    let examId: string | null = null;
    if (input.examId) {
      await examinationService.applyBlueprint({ blueprintId, examId: input.examId }, actor);
      examId = input.examId;
    }

    return { blueprintId, examId, status: 'draft' };
  }
}

export const contentGeneratorService = new ContentGeneratorService();
