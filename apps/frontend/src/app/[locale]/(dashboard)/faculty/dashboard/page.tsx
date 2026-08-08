'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Button, Card, CardContent, PageHeader, StatCard, StatGrid } from '@learnova/ui';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BookOpenCheck,
  ClipboardCheck,
  Clock3,
  FolderKanban,
  GraduationCap,
  PenLine,
  ShieldCheck,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  DashboardPanel,
  DashboardQuickActions,
  DashboardTaskList,
  type DashboardTaskItem,
} from '@/components/dashboard/dashboard-panels';
import {
  formatDueDate,
  formatSubmissionStatus,
  useFacultyAssignmentDashboard,
  useSubmissionList,
} from '@/features/assignment';
import {
  formatExamStatus,
  formatExamWindow,
  useExamList,
  useFacultyExamDashboard,
} from '@/features/examination';
import { useFacultyProjectDashboard } from '@/features/project';
import { Link } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

function displayName(firstName?: string | null, lastName?: string | null, email?: string) {
  const full = [firstName, lastName].filter(Boolean).join(' ');
  return full || email?.split('@')[0] || 'Faculty';
}

export default function FacultyDashboardPage() {
  const t = useTranslations('dashboard.facultyHome');
  const { user } = useAuth();

  const assignmentDash = useFacultyAssignmentDashboard();
  const examDash = useFacultyExamDashboard();
  const projectDash = useFacultyProjectDashboard();
  const submissionsQuery = useSubmissionList({
    status: 'submitted',
    page: 1,
    limit: 6,
    sortBy: 'submittedAt',
    sortOrder: 'desc',
  });
  const examsQuery = useExamList({
    page: 1,
    limit: 5,
    sortBy: 'startsAt',
    sortOrder: 'asc',
  });

  const assignStats = assignmentDash.data;
  const examStats = examDash.data;
  const projectStats = projectDash.data;
  const pendingSubmissions = submissionsQuery.data?.items ?? [];
  const upcomingExams = examsQuery.data?.items ?? [];

  const gradingQueue: DashboardTaskItem[] = useMemo(
    () =>
      pendingSubmissions.map((sub) => ({
        id: sub.id,
        title: `Submission #${sub.attemptNumber}`,
        subtitle: `Assignment · ${formatSubmissionStatus(sub.status)}`,
        status: sub.lateSubmission ? 'late' : 'submitted',
        href: APP_ROUTES.FACULTY_ASSIGNMENTS,
        meta: sub.submittedAt ? formatDueDate(sub.submittedAt) : undefined,
      })),
    [pendingSubmissions],
  );

  const examTasks: DashboardTaskItem[] = useMemo(
    () =>
      upcomingExams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        subtitle: formatExamWindow(exam.schedule.startsAt, exam.schedule.endsAt),
        status: exam.status,
        href: APP_ROUTES.FACULTY_EXAMINATIONS,
        meta: formatExamStatus(exam.status),
      })),
    [upcomingExams],
  );

  const projectDeadlines: DashboardTaskItem[] = useMemo(
    () =>
      (projectStats?.upcomingDeadlines ?? []).slice(0, 5).map((item) => ({
        id: item.projectId,
        title: item.title,
        subtitle: 'Project deadline',
        status: 'pending',
        href: APP_ROUTES.FACULTY_PROJECTS,
        meta: formatDueDate(item.dueDate),
      })),
    [projectStats?.upcomingDeadlines],
  );

  const name = displayName(user?.firstName, user?.lastName, user?.email);

  return (
    <DashboardPage>
      <PageHeader
        eyebrow={t('roleLabel')}
        title={t('welcomeNamed', { name })}
        description={t('modulesIntro')}
        actions={
          <Button asChild className="rounded-xl">
            <Link href={APP_ROUTES.FACULTY_ASSIGNMENTS}>
              <PenLine className="size-4" />
              Review submissions
            </Link>
          </Button>
        }
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-caption font-medium text-warning">
              <Clock3 className="size-3.5" />
              {assignStats?.pendingReviews ?? 0} awaiting review
            </span>
            {(examStats?.examsInProgress ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-caption font-medium text-accent">
                <ShieldCheck className="size-3.5" />
                {examStats?.examsInProgress} exam in progress
              </span>
            ) : null}
          </>
        }
      />

      <motion.div {...fadeUp} transition={{ duration: 0.35 }}>
        <StatGrid>
          <StatCard
            label="Pending grading"
            value={assignStats?.pendingReviews ?? '—'}
            hint="Submissions waiting for marks"
            icon={ClipboardCheck}
            accent="warning"
            loading={assignmentDash.isLoading}
            trend={
              assignStats?.lateSubmissions
                ? { value: `${assignStats.lateSubmissions} late`, positive: false }
                : undefined
            }
          />
          <StatCard
            label="Assignments"
            value={assignStats?.assignmentsCreated ?? '—'}
            hint={
              assignStats
                ? `${Math.round(assignStats.submissionRate * 100)}% submission rate`
                : undefined
            }
            icon={BookOpenCheck}
            accent="primary"
            loading={assignmentDash.isLoading}
          />
          <StatCard
            label="Exams scheduled"
            value={examStats?.examsScheduled ?? '—'}
            hint={`${examStats?.totalAttempts ?? 0} total attempts`}
            icon={GraduationCap}
            accent="accent"
            loading={examDash.isLoading}
          />
          <StatCard
            label="Project reviews"
            value={projectStats?.pendingReviews ?? '—'}
            hint={`${projectStats?.studentTeams ?? 0} active teams`}
            icon={FolderKanban}
            accent="success"
            loading={projectDash.isLoading}
            trend={
              projectStats?.lateSubmissions
                ? { value: `${projectStats.lateSubmissions} late`, positive: false }
                : undefined
            }
          />
        </StatGrid>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]"
      >
        <div className="space-y-6">
          <DashboardPanel
            title="Needs your attention"
            description="Submissions and exams that need action today"
            action={
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href={APP_ROUTES.FACULTY_ASSIGNMENTS}>View all</Link>
              </Button>
            }
          >
            <DashboardTaskList
              items={gradingQueue}
              emptyTitle="Queue is clear"
              emptyDescription="No submissions are waiting for grading right now."
              icon={ClipboardCheck}
            />
          </DashboardPanel>

          <DashboardPanel
            title="Upcoming exams"
            description="Scheduled assessments on your calendar"
            action={
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href={APP_ROUTES.FACULTY_EXAMINATIONS}>Open exams</Link>
              </Button>
            }
          >
            <DashboardTaskList
              items={examTasks}
              emptyTitle="No upcoming exams"
              emptyDescription="Published exams will appear here as they approach."
              icon={GraduationCap}
            />
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <Card interactive className="overflow-hidden border-warning/20 bg-gradient-to-br from-warning/5 via-background to-background">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <AlertTriangle className="size-5" />
                </span>
                <div>
                  <p className="text-section-title">Today&apos;s workload</p>
                  <p className="mt-1 text-caption">
                    {(assignStats?.lateSubmissions ?? 0) > 0
                      ? `${assignStats?.lateSubmissions} late submissions need follow-up.`
                      : 'You are caught up on late work.'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-caption">Avg. grade</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                    {assignStats?.averageGrade != null ? assignStats.averageGrade.toFixed(1) : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-caption">Violations</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                    {examStats ? `${Math.round(examStats.violationRate * 100)}%` : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DashboardPanel
            title="Project deadlines"
            description="Teams approaching milestone due dates"
          >
            <DashboardTaskList
              items={projectDeadlines}
              emptyTitle="No project deadlines"
              emptyDescription="Upcoming project milestones will show here."
              icon={FolderKanban}
            />
          </DashboardPanel>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-section-title">Quick actions</p>
                <p className="mt-1 text-caption">Jump into your most common teaching tasks</p>
              </div>
              <DashboardQuickActions
                actions={[
                  { label: 'Assignments', href: APP_ROUTES.FACULTY_ASSIGNMENTS, icon: ClipboardCheck },
                  { label: 'Gradebook', href: APP_ROUTES.FACULTY_GRADEBOOK, icon: BookOpenCheck },
                  { label: 'Exams', href: APP_ROUTES.FACULTY_EXAMS, icon: GraduationCap },
                  { label: 'Projects', href: APP_ROUTES.FACULTY_PROJECTS, icon: FolderKanban },
                  { label: 'Proctoring', href: APP_ROUTES.FACULTY_PROCTORING, icon: ShieldCheck },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
