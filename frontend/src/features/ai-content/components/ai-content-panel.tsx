'use client';

import { useState } from 'react';
import { Button, Input } from '@learnova/ui';
import { Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type {
  AiBlueprintProposal,
  AiOutlineProposal,
  AiQuestionProposal,
  AiQuizProposal,
} from '@learnova/validation';
import { getApiErrorMessage } from '@/lib/api/client';
import { useExamList } from '@/features/examination';
import { aiContentApi } from '../services/ai-content-api';

type TabId = 'outline' | 'quiz' | 'blueprint';

function updateOutline(
  outline: AiOutlineProposal,
  moduleIndex: number,
  lessonIndex: number | null,
  patch: { title?: string; summary?: string; bullets?: string[] },
): AiOutlineProposal {
  return {
    modules: outline.modules.map((module, index) => {
      if (index !== moduleIndex) return module;
      if (lessonIndex === null) return { ...module, title: patch.title ?? module.title };
      return {
        ...module,
        lessons: module.lessons.map((lesson, lessonAt) =>
          lessonAt === lessonIndex ? { ...lesson, ...patch } : lesson,
        ),
      };
    }),
  };
}

interface AiContentPanelProps {
  courseId: string;
  onSaved?: () => void;
}

export function AiContentPanel({ courseId, onSaved }: AiContentPanelProps) {
  const t = useTranslations('dashboard.institution.aiContent');
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabId>('outline');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [moduleCount, setModuleCount] = useState(5);
  const [lessonsPerModule, setLessonsPerModule] = useState(3);
  const [outline, setOutline] = useState<AiOutlineProposal | null>(null);

  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');
  const [questionMarks, setQuestionMarks] = useState('');
  const [quiz, setQuiz] = useState<AiQuizProposal | null>(null);

  const [topics, setTopics] = useState('');
  const [instructions, setInstructions] = useState('');
  const [negativeMarks, setNegativeMarks] = useState(0);

  const [totalMarks, setTotalMarks] = useState(100);
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [blueprint, setBlueprint] = useState<AiBlueprintProposal | null>(null);
  const [examId, setExamId] = useState('');

  const exams = useExamList({ courseId, status: 'draft', limit: 20 }, open && tab === 'blueprint');

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setError(getApiErrorMessage(err, t('failed')));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button type="button" size="sm" className="rounded-xl" onClick={() => { setOpen(true); }}>
        <Sparkles className="size-4" />
        {t('open')}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <div className="mt-8 w-full max-w-3xl rounded-2xl border border-border bg-background p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">{t('title')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => { setOpen(false); }}>
                <X className="size-4" />
              </Button>
            </div>

            <div className="mb-4 flex gap-2">
              {(['outline', 'quiz', 'blueprint'] as const).map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={tab === item ? 'default' : 'outline'}
                  onClick={() => { setTab(item); }}
                >
                  {t(`tabs.${item}`)}
                </Button>
              ))}
            </div>

            {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
            {notice ? <p className="mb-3 text-sm text-primary">{notice}</p> : null}

            <TeacherBrief
              topics={topics}
              instructions={instructions}
              negativeMarks={negativeMarks}
              onTopics={setTopics}
              onInstructions={setInstructions}
              onNegativeMarks={setNegativeMarks}
            />

            {tab === 'outline' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <label className="text-sm">
                    {t('moduleCount')}
                    <Input
                      className="mt-1 w-24"
                      type="number"
                      min={1}
                      max={8}
                      value={moduleCount}
                      onChange={(event) => { setModuleCount(Number(event.target.value)); }}
                    />
                  </label>
                  <label className="text-sm">
                    {t('lessonsPerModule')}
                    <Input
                      className="mt-1 w-24"
                      type="number"
                      min={1}
                      max={4}
                      value={lessonsPerModule}
                      onChange={(event) => { setLessonsPerModule(Number(event.target.value)); }}
                    />
                  </label>
                  <Button
                    type="button"
                    className="self-end"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const proposal = await aiContentApi.generateOutline(courseId, {
                          moduleCount,
                          lessonsPerModule,
                          topics,
                          instructions,
                        });
                        setOutline(proposal);
                      })
                    }
                  >
                    {busy ? t('generating') : t('generate')}
                  </Button>
                </div>
                {outline?.modules.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="rounded-xl border border-border p-3">
                    <Input
                      value={module.title}
                      onChange={(event) => {
                        setOutline(updateOutline(outline, moduleIndex, null, { title: event.target.value }));
                      }}
                    />
                    <div className="mt-3 space-y-3">
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="rounded-lg bg-muted/40 p-3">
                          <Input
                            value={lesson.title}
                            onChange={(event) => {
                              setOutline(
                                updateOutline(outline, moduleIndex, lessonIndex, {
                                  title: event.target.value,
                                }),
                              );
                            }}
                          />
                          <textarea
                            className="mt-2 min-h-16 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            value={lesson.summary}
                            onChange={(event) => {
                              setOutline(
                                updateOutline(outline, moduleIndex, lessonIndex, {
                                  summary: event.target.value,
                                }),
                              );
                            }}
                          />
                          <textarea
                            className="mt-2 min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                            value={lesson.bullets.join('\n')}
                            onChange={(event) => {
                              setOutline(
                                updateOutline(outline, moduleIndex, lessonIndex, {
                                  bullets: event.target.value
                                    .split('\n')
                                    .map((line) => line.trim())
                                    .filter(Boolean),
                                }),
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {outline ? (
                  <Button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await aiContentApi.acceptOutline(courseId, outline);
                        setOutline(null);
                        setNotice(t('outlineSaved'));
                        onSaved?.();
                      })
                    }
                  >
                    {t('saveDraft')}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {tab === 'quiz' ? (
              <QuizTab
                busy={busy}
                questionCount={questionCount}
                difficulty={difficulty}
                questionMarks={questionMarks}
                quiz={quiz}
                onQuestionCount={setQuestionCount}
                onDifficulty={setDifficulty}
                onQuestionMarks={setQuestionMarks}
                onQuiz={setQuiz}
                onGenerate={() =>
                  void run(async () => {
                    const marks = questionMarks.trim() === '' ? undefined : Number(questionMarks);
                    const proposal = await aiContentApi.generateQuiz(courseId, {
                      questionCount,
                      difficulty,
                      topics,
                      instructions,
                      negativeMarks,
                      ...(marks === undefined || Number.isNaN(marks) ? {} : { marks }),
                    });
                    setQuiz(proposal);
                  })
                }
                onSave={() =>
                  void run(async () => {
                    if (!quiz) return;
                    await aiContentApi.acceptQuiz(courseId, quiz);
                    setQuiz(null);
                    setNotice(t('quizSaved'));
                    onSaved?.();
                  })
                }
              />
            ) : null}

            {tab === 'blueprint' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <label className="text-sm">
                    {t('totalMarks')}
                    <Input
                      className="mt-1 w-24"
                      type="number"
                      min={1}
                      value={totalMarks}
                      onChange={(event) => { setTotalMarks(Number(event.target.value)); }}
                    />
                  </label>
                  <label className="text-sm">
                    {t('duration')}
                    <Input
                      className="mt-1 w-24"
                      type="number"
                      min={1}
                      value={durationMinutes}
                      onChange={(event) => { setDurationMinutes(Number(event.target.value)); }}
                    />
                  </label>
                  <Button
                    type="button"
                    className="self-end"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const proposal = await aiContentApi.generateBlueprint(courseId, {
                          totalMarks,
                          durationMinutes,
                          topics,
                          instructions,
                          negativeMarks,
                        });
                        setBlueprint(proposal);
                      })
                    }
                  >
                    {busy ? t('generating') : t('generate')}
                  </Button>
                </div>
                {blueprint ? (
                  <>
                    <Input
                      value={blueprint.name}
                      onChange={(event) => { setBlueprint({ ...blueprint, name: event.target.value }); }}
                    />
                    <textarea
                      className="min-h-16 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      value={blueprint.description}
                      onChange={(event) =>
                        { setBlueprint({ ...blueprint, description: event.target.value }); }
                      }
                    />
                    {blueprint.slots.map((slot, index) => (
                      <div key={index} className="grid grid-cols-4 gap-2">
                        <Input
                          value={slot.difficulty ?? ''}
                          onChange={(event) => {
                            const slots = blueprint.slots.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, difficulty: event.target.value } : item,
                            );
                            setBlueprint({ ...blueprint, slots });
                          }}
                        />
                        <Input
                          value={slot.category ?? ''}
                          onChange={(event) => {
                            const slots = blueprint.slots.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, category: event.target.value } : item,
                            );
                            setBlueprint({ ...blueprint, slots });
                          }}
                        />
                        <Input
                          type="number"
                          value={slot.marks}
                          onChange={(event) => {
                            const slots = blueprint.slots.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, marks: Number(event.target.value) } : item,
                            );
                            setBlueprint({ ...blueprint, slots });
                          }}
                        />
                        <Input
                          type="number"
                          value={slot.count}
                          onChange={(event) => {
                            const slots = blueprint.slots.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, count: Number(event.target.value) } : item,
                            );
                            setBlueprint({ ...blueprint, slots });
                          }}
                        />
                      </div>
                    ))}
                    <label className="block text-sm">
                      {t('applyExam')}
                      <select
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                        value={examId}
                        onChange={(event) => { setExamId(event.target.value); }}
                      >
                        <option value="">{t('applyExamNone')}</option>
                        {(exams.data?.items ?? []).map((exam) => (
                          <option key={exam.id} value={exam.id}>
                            {exam.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await aiContentApi.acceptBlueprint(courseId, {
                            ...blueprint,
                            questionPoolIds: [],
                            ...(examId ? { examId } : {}),
                          });
                          setBlueprint(null);
                          setNotice(t('blueprintSaved'));
                          onSaved?.();
                        })
                      }
                    >
                      {t('saveDraft')}
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

function TeacherBrief({
  topics,
  instructions,
  negativeMarks,
  onTopics,
  onInstructions,
  onNegativeMarks,
}: {
  topics: string;
  instructions: string;
  negativeMarks: number;
  onTopics: (value: string) => void;
  onInstructions: (value: string) => void;
  onNegativeMarks: (value: number) => void;
}) {
  const t = useTranslations('dashboard.institution.aiContent');

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-border p-3">
      <div>
        <p className="text-sm font-medium">{t('teacherBrief')}</p>
        <p className="text-xs text-muted-foreground">{t('teacherBriefHelp')}</p>
      </div>
      <label className="block text-sm">
        {t('topics')}
        <textarea
          className="mt-1 min-h-16 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={topics}
          placeholder={t('topicsPlaceholder')}
          onChange={(event) => { onTopics(event.target.value); }}
        />
      </label>
      <label className="block text-sm">
        {t('instructions')}
        <textarea
          className="mt-1 min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={instructions}
          placeholder={t('instructionsPlaceholder')}
          onChange={(event) => { onInstructions(event.target.value); }}
        />
      </label>
      <label className="text-sm">
        {t('negativeMarks')}
        <Input
          className="mt-1 w-28"
          type="number"
          min={0}
          step="0.25"
          value={negativeMarks}
          onChange={(event) => { onNegativeMarks(Number(event.target.value)); }}
        />
      </label>
    </div>
  );
}

function QuizTab({
  busy,
  questionCount,
  difficulty,
  questionMarks,
  quiz,
  onQuestionCount,
  onDifficulty,
  onQuestionMarks,
  onQuiz,
  onGenerate,
  onSave,
}: {
  busy: boolean;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionMarks: string;
  quiz: AiQuizProposal | null;
  onQuestionCount: (value: number) => void;
  onDifficulty: (value: 'easy' | 'medium' | 'hard' | 'mixed') => void;
  onQuestionMarks: (value: string) => void;
  onQuiz: (value: AiQuizProposal) => void;
  onGenerate: () => void;
  onSave: () => void;
}) {
  const t = useTranslations('dashboard.institution.aiContent');

  function updateQuestion(index: number, patch: Partial<AiQuestionProposal>) {
    if (!quiz) return;
    const questions = quiz.questions.map((question, questionIndex) =>
      questionIndex === index ? { ...question, ...patch } : question,
    );
    onQuiz({ ...quiz, questions });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">
          {t('questionCount')}
          <Input
            className="mt-1 w-24"
            type="number"
            min={5}
            max={20}
            value={questionCount}
            onChange={(event) => { onQuestionCount(Number(event.target.value)); }}
          />
        </label>
        <label className="text-sm">
          {t('marksEach')}
          <Input
            className="mt-1 w-24"
            type="number"
            min={0}
            step="0.5"
            value={questionMarks}
            placeholder={t('marksEachPlaceholder')}
            onChange={(event) => { onQuestionMarks(event.target.value); }}
          />
        </label>
        <label className="text-sm">
          {t('difficulty')}
          <select
            className="mt-1 block rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={difficulty}
            onChange={(event) =>
              { onDifficulty(event.target.value as 'easy' | 'medium' | 'hard' | 'mixed'); }
            }
          >
            <option value="mixed">{t('mixed')}</option>
            <option value="easy">{t('easy')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="hard">{t('hard')}</option>
          </select>
        </label>
        <Button type="button" className="self-end" disabled={busy} onClick={onGenerate}>
          {busy ? t('generating') : t('generate')}
        </Button>
      </div>
      {quiz ? (
        <>
          <Input
            value={quiz.title}
            onChange={(event) => { onQuiz({ ...quiz, title: event.target.value }); }}
          />
          {quiz.questions.map((question, index) => (
            <div key={index} className="rounded-xl border border-border p-3">
              <textarea
                className="min-h-16 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={question.question}
                onChange={(event) => { updateQuestion(index, { question: event.target.value }); }}
              />
              <div className="mt-2 flex flex-wrap gap-3">
                <label className="text-sm">
                  {t('marksEach')}
                  <Input
                    className="mt-1 w-24"
                    type="number"
                    min={0}
                    value={question.marks}
                    onChange={(event) => { updateQuestion(index, { marks: Number(event.target.value) }); }}
                  />
                </label>
                <label className="text-sm">
                  {t('negativeMarks')}
                  <Input
                    className="mt-1 w-24"
                    type="number"
                    min={0}
                    step="0.25"
                    value={question.negativeMarks}
                    onChange={(event) => { updateQuestion(index, { negativeMarks: Number(event.target.value) }); }}
                  />
                </label>
              </div>
              <div className="mt-2 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={option.isCorrect}
                      onChange={(event) => {
                        const options = question.options.map((item, itemIndex) =>
                          itemIndex === optionIndex
                            ? { ...item, isCorrect: event.target.checked }
                            : item,
                        );
                        updateQuestion(index, { options });
                      }}
                    />
                    <Input
                      value={option.optionText}
                      onChange={(event) => {
                        const options = question.options.map((item, itemIndex) =>
                          itemIndex === optionIndex
                            ? { ...item, optionText: event.target.value }
                            : item,
                        );
                        updateQuestion(index, { options });
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          <Button type="button" disabled={busy} onClick={onSave}>
            {t('saveDraft')}
          </Button>
        </>
      ) : null}
    </div>
  );
}
