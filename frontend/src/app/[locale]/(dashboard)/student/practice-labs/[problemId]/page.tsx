'use client';

import { PRACTICE_LANGUAGE_META, PERMISSIONS } from '@learnova/constants';
import type { PracticeLanguage, RunCodeResult } from '@learnova/types';
import { outputsMatch } from '@learnova/shared';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@learnova/ui';
import { use, useEffect, useState } from 'react';
import { PermissionGate } from '@/components/shared/protected-route';
import { ErrorState } from '@/features/institution';
import {
  CodeEditor,
  formatDifficulty,
  formatVerdict,
  useLabProblem,
  usePracticeEditorStore,
  useRunCodeMutation,
  useSubmitSolutionMutation,
} from '@/features/practice-lab';
import { Link } from '@/lib/i18n/routing';

function isSuccessfulRun(
  result: RunCodeResult,
  sampleOutput: string | null | undefined,
): boolean {
  if (result.status !== 'accepted') return false;
  if (sampleOutput != null && sampleOutput !== '') {
    return outputsMatch(result.stdout, sampleOutput);
  }
  return true;
}

export default function StudentPracticeProblemPage({
  params,
}: {
  params: Promise<{ problemId: string }>;
}) {
  const { problemId } = use(params);
  const problemQuery = useLabProblem(problemId);
  const runMutation = useRunCodeMutation();
  const submitMutation = useSubmitSolutionMutation();

  const language = usePracticeEditorStore((s) => s.language);
  const sourceCode = usePracticeEditorStore((s) => s.sourceCode);
  const stdin = usePracticeEditorStore((s) => s.stdin);
  const setLanguage = usePracticeEditorStore((s) => s.setLanguage);
  const setSourceCode = usePracticeEditorStore((s) => s.setSourceCode);
  const setStdin = usePracticeEditorStore((s) => s.setStdin);
  const fontSize = usePracticeEditorStore((s) => s.fontSize);
  const setFontSize = usePracticeEditorStore((s) => s.setFontSize);
  const theme = usePracticeEditorStore((s) => s.theme);
  const setTheme = usePracticeEditorStore((s) => s.setTheme);

  const [output, setOutput] = useState<string>('');
  const [verdict, setVerdict] = useState<string | null>(null);
  const [verifiedRunExecutionId, setVerifiedRunExecutionId] = useState<string | null>(null);

  const problem = problemQuery.data;

  useEffect(() => {
    setVerifiedRunExecutionId(null);
    setVerdict(null);
  }, [sourceCode, language, stdin, problem?.id]);

  useEffect(() => {
    if (!problem) return;
    const langs = problem.allowedLanguages;
    const nextLang = langs.includes(language) ? language : langs[0] ?? 'python';
    if (nextLang !== language) setLanguage(nextLang);
    const bp = problem.boilerplates.find((b) => b.language === nextLang);
    if (bp?.code) setSourceCode(bp.code);
    if (problem.sampleInput) setStdin(problem.sampleInput);
    // autosave draft
    const key = `practice-draft:${problem.id}:${nextLang}`;
    const saved = localStorage.getItem(key);
    if (saved) setSourceCode(saved);
  }, [problem?.id]);

  useEffect(() => {
    if (!problem) return;
    const key = `practice-draft:${problem.id}:${language}`;
    localStorage.setItem(key, sourceCode);
  }, [sourceCode, language, problem?.id]);

  return (
    <PermissionGate permission={PERMISSIONS.LAB_WRITE} enforce>
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/student/practice-labs">← Back to problems</Link>
        </Button>

        {problemQuery.isError ? (
          <ErrorState message="Unable to load problem." />
        ) : problemQuery.isLoading || !problem ? (
          <Skeleton className="h-[70vh] w-full" />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>{problem.title}</CardTitle>
                  <Badge variant="outline">{formatDifficulty(problem.difficulty)}</Badge>
                </div>
                <CardDescription>{problem.tags.join(' · ') || 'Practice problem'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed">
                <div className="whitespace-pre-wrap">{problem.problemStatement}</div>
                {problem.inputFormat ? (
                  <div>
                    <p className="font-medium">Input format</p>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                      {problem.inputFormat}
                    </p>
                  </div>
                ) : null}
                {problem.outputFormat ? (
                  <div>
                    <p className="font-medium">Output format</p>
                    <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                      {problem.outputFormat}
                    </p>
                  </div>
                ) : null}
                {problem.sampleInput != null ? (
                  <div>
                    <p className="font-medium">Sample input</p>
                    <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                      {problem.sampleInput}
                    </pre>
                  </div>
                ) : null}
                {problem.sampleOutput != null ? (
                  <div>
                    <p className="font-medium">Sample output</p>
                    <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-3 text-xs">
                      {problem.sampleOutput}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  value={language}
                  onChange={(e) => {
                    const next = e.target.value as PracticeLanguage;
                    setLanguage(next);
                    const bp = problem.boilerplates.find((b) => b.language === next);
                    if (bp?.code) setSourceCode(bp.code);
                  }}
                >
                  {problem.allowedLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {PRACTICE_LANGUAGE_META[lang].name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setFontSize(Math.max(12, fontSize - 1)); }}
                >
                  A-
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setFontSize(Math.min(22, fontSize + 1)); }}
                >
                  A+
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setTheme(theme === 'vs-dark' ? 'light' : 'vs-dark'); }}
                >
                  Theme
                </Button>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    disabled={runMutation.isPending}
                    onClick={async () => {
                      setVerdict(null);
                      setVerifiedRunExecutionId(null);
                      const result = await runMutation.mutateAsync({
                        problemId: problem.id,
                        language,
                        sourceCode,
                        stdin,
                      });
                      const passed = isSuccessfulRun(result, problem.sampleOutput);
                      if (passed) {
                        setVerifiedRunExecutionId(result.executionId);
                      }
                      setOutput(
                        [
                          result.compileOutput && `Compile:\n${result.compileOutput}`,
                          result.stdout && `Stdout:\n${result.stdout}`,
                          result.stderr && `Stderr:\n${result.stderr}`,
                          `Status: ${result.status}`,
                          passed
                            ? 'Sample check: PASS — you can submit now.'
                            : problem.sampleOutput
                              ? 'Sample check: FAIL — fix output and run again before submitting.'
                              : result.status === 'accepted'
                                ? 'Run succeeded — you can submit now.'
                                : 'Run failed — fix errors and run again before submitting.',
                          result.executionTimeMS != null && `Time: ${result.executionTimeMS}ms`,
                          result.memoryKB != null && `Memory: ${result.memoryKB}KB`,
                        ]
                          .filter(Boolean)
                          .join('\n\n'),
                      );
                    }}
                  >
                    Run code
                  </Button>
                  <Button
                    disabled={submitMutation.isPending || !verifiedRunExecutionId}
                    title={
                      verifiedRunExecutionId
                        ? 'Submit for grading'
                        : 'Run your code successfully before submitting'
                    }
                    onClick={async () => {
                      if (!verifiedRunExecutionId) return;
                      const result = await submitMutation.mutateAsync({
                        problemId: problem.id,
                        language,
                        sourceCode,
                        runExecutionId: verifiedRunExecutionId,
                      });
                      setVerdict(result.verdict);
                      setOutput(
                        [
                          `Verdict: ${formatVerdict(result.verdict)}`,
                          `Score: ${result.score}/${result.maxScore}`,
                          `Passed: ${result.passedCount}/${result.totalCount}`,
                          result.compileOutput && `Compile:\n${result.compileOutput}`,
                          ...result.results
                            .filter((r) => r.visibility === 'public')
                            .map(
                              (r, i) =>
                                `Public TC ${i + 1}: ${r.passed ? 'PASS' : 'FAIL'} (${r.status})`,
                            ),
                        ]
                          .filter(Boolean)
                          .join('\n\n'),
                      );
                    }}
                  >
                    Submit
                  </Button>
                </div>
              </div>

              {!verifiedRunExecutionId ? (
                <p className="text-xs text-muted-foreground">
                  Run your code with the sample input and pass before submitting.
                </p>
              ) : (
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Sample run passed — submit is unlocked.
                </p>
              )}

              <CodeEditor language={language} value={sourceCode} onChange={setSourceCode} height="380px" />

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">stdin</p>
                  <textarea
                    className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
                    value={stdin}
                    onChange={(e) => { setStdin(e.target.value); }}
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    output {verdict ? `· ${formatVerdict(verdict as never)}` : ''}
                  </p>
                  <pre className="min-h-24 overflow-auto rounded-md border border-border/60 bg-muted/40 p-3 font-mono text-xs">
                    {output || 'Run your code to see results. Submit unlocks after a successful run.'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGate>
  );
}
