'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Button, Card, CardContent, PageHeader, StatCard, StatGrid } from '@learnova/ui';
import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  CalendarClock,
  Flame,
  GraduationCap,
  PlayCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
  DashboardPage,
  dashboardFadeUp,
} from '@/components/dashboard/dashboard-template';
import {
  DashboardPanel,
  DashboardQuickActions,
  DashboardTaskList,
  type DashboardTaskItem,
} from '@/components/dashboard/dashboard-panels';
import {
  formatDueDate,
  useMyAssignments,
  useStudentAssignmentDashboard,
} from '@/features/assignment';
import { useStudentExamDashboard } from '@/features/examination';
import { formatActivityKind, formatPercentage, useStudentGradebookDashboard } from '@/features/gradebook';
import { useStudentProjectDashboard } from '@/features/project';
import { useStudentProgressDashboard } from '@/features/progress';
import { Link } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';

const fadeUp = dashboardFadeUp;

function displayName(firstName?: string | null, lastName?: string | null, email?: string) {
  const full = [firstName, lastName].filter(Boolean).join(' ');
  return full || email?.split('@')[0] || 'Student';
}

export default function StudentDashboardPage() {
  const t = useTranslations('dashboard.studentHome');
  const { user } = useAuth();

  const progressDash = useStudentProgressDashboard();
  const assignmentDash = useStudentAssignmentDashboard();
  const gradebookDash = useStudentGradebookDashboard();
  const examDash = useStudentExamDashboard();
  const projectDash = useStudentProjectDashboard();
  const assignmentsQuery = useMyAssignments({
    status: 'published',
    page: 1,
    limit: 6,
    sortBy: 'dueDate',
    sortOrder: 'asc',
  });

  const progress = progressDash.data;
  const assignments = assignmentDash.data;
  const gradebook = gradebookDash.data;
  const exams = examDash.data;
  const projects = projectDash.data;
  const upcomingAssignments = assignmentsQuery.data?.items ?? [];
  const continueCourse = progress?.continueLearning?.[0];

  const todayTasks: DashboardTaskItem[] = useMemo(
    () =>
      upcomingAssignments.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: `Due ${formatDueDate(row.dueDate)}`,
        status: row.status,
        href: `${APP_ROUTES.STUDENT_ASSIGNMENTS}/${row.id}`,
        meta: `${row.totalMarks} marks`,
      })),
    [upcomingAssignments],
  );

  const upcomingDeadlines: DashboardTaskItem[] = useMemo(() => {
    const examItems: DashboardTaskItem[] = (projects?.upcomingDeadlines ?? []).map((item) => ({
      id: `project-${item.projectId}`,
      title: item.title,
      subtitle: 'Project deadline',
      status: 'pending',
      href: `${APP_ROUTES.STUDENT_PROJECTS}/${item.projectId}`,
      meta: formatDueDate(item.dueDate),
    }));
    return examItems;
  }, [projects?.upcomingDeadlines]);

  const recentGrades: DashboardTaskItem[] = useMemo(
    () =>
      (gradebook?.recentEntries ?? []).slice(0, 5).map((entry) => ({
        id: entry.id,
        title: entry.activityTitle,
        subtitle: formatActivityKind(entry.activityKind),
        status: entry.passed == null ? entry.status : entry.passed ? 'completed' : 'rejected',
        href: APP_ROUTES.STUDENT_GRADEBOOK,
        meta: formatPercentage(entry.percentage),
      })),
    [gradebook?.recentEntries],
  );

  const name = displayName(user?.firstName, user?.lastName, user?.email);

  return (
    <DashboardPage>
      <PageHeader
        eyebrow={t('roleLabel')}
        title={t('welcomeNamed', { name })}
        description={t('modulesIntro')}
        meta={
          progress?.currentStreakDays ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-caption font-medium text-warning">
              <Flame className="size-3.5" />
              {progress.currentStreakDays} day streak
            </span>
          ) : null
        }
      />

      {continueCourse ? (
        <motion.div {...fadeUp} transition={{ duration: 0.35 }}>
          <Card interactive glass className="overflow-hidden">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-caption font-medium text-primary">
                  <Sparkles className="size-3.5" />
                  Continue learning
                </div>
                <div>
                  <p className="text-section-title">{continueCourse.courseTitle}</p>
                  <p className="mt-1 text-caption">
                    {continueCourse.estimatedRemainingMinutes} min remaining ·{' '}
                    {continueCourse.progressPercentage}% complete
                  </p>
                </div>
                <div className="h-2 max-w-md overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-brand-gradient"
                    initial={{ width: 0 }}
                    animate={{ width: `${continueCourse.progressPercentage}%` }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
              <Button asChild size="lg" className="rounded-xl">
                <Link href={`${APP_ROUTES.STUDENT_PROGRESS}/course/${continueCourse.courseId}`}>
                  <PlayCircle className="size-4" />
                  Resume lesson
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      <motion.div {...fadeUp} transition={{ duration: 0.35, delay: 0.04 }}>
        <StatGrid>
          <StatCard
            label="Current GPA"
            value={
              gradebook?.semesterGpa != null
                ? gradebook.semesterGpa.toFixed(2)
                : gradebook?.cgpa != null
                  ? gradebook.cgpa.toFixed(2)
                  : '—'
            }
            hint={formatPercentage(gradebook?.averagePercentage)}
            icon={TrendingUp}
            accent="success"
            loading={gradebookDash.isLoading}
          />
          <StatCard
            label="Due soon"
            value={assignments?.upcoming ?? '—'}
            hint={`${assignments?.pending ?? 0} not started`}
            icon={CalendarClock}
            accent="warning"
            loading={assignmentDash.isLoading}
            trend={
              assignments?.late ? { value: `${assignments.late} late`, positive: false } : undefined
            }
          />
          <StatCard
            label="Courses active"
            value={progress?.coursesInProgress ?? '—'}
            hint={`${progress?.lessonsCompleted ?? 0} lessons done`}
            icon={BookOpen}
            accent="primary"
            loading={progressDash.isLoading}
          />
          <StatCard
            label="Upcoming exams"
            value={exams?.upcomingExams ?? '—'}
            hint={`${exams?.completedExams ?? 0} completed`}
            icon={GraduationCap}
            accent="accent"
            loading={examDash.isLoading}
          />
        </StatGrid>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.35, delay: 0.08 }}
        className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
      >
        <div className="space-y-6">
          <DashboardPanel
            title="Today's tasks"
            description="Assignments and coursework due next"
            action={
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href={APP_ROUTES.STUDENT_ASSIGNMENTS}>All assignments</Link>
              </Button>
            }
          >
            <DashboardTaskList
              items={todayTasks}
              emptyTitle="You're all caught up"
              emptyDescription="No published assignments are waiting for you."
              icon={CalendarClock}
            />
          </DashboardPanel>

          <DashboardPanel
            title="Recent grades"
            description="Your latest scored activities"
            action={
              <Button asChild variant="ghost" size="sm" className="rounded-xl">
                <Link href={APP_ROUTES.STUDENT_GRADEBOOK}>Full gradebook</Link>
              </Button>
            }
          >
            <DashboardTaskList
              items={recentGrades}
              emptyTitle="No grades yet"
              emptyDescription="Graded work will appear here as faculty publish results."
              icon={Award}
            />
          </DashboardPanel>
        </div>

        <div className="space-y-6">
          <Card interactive className="overflow-hidden border-accent/20 bg-gradient-to-br from-accent/5 via-background to-background">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Flame className="size-5" />
                </span>
                <div>
                  <p className="text-section-title">Learning momentum</p>
                  <p className="mt-1 text-caption">
                    {progress?.hoursLearned ?? 0} hours learned · {progress?.modulesCompleted ?? 0}{' '}
                    modules completed
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-caption">Submitted</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                    {assignments?.submitted ?? '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-caption">Grades received</p>
                  <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                    {assignments?.gradesReceived ?? '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <DashboardPanel title="Upcoming deadlines" description="Projects and milestones on your radar">
            <DashboardTaskList
              items={upcomingDeadlines}
              emptyTitle="No deadlines soon"
              emptyDescription="Project due dates will surface here automatically."
              icon={CalendarClock}
            />
          </DashboardPanel>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <p className="text-section-title">Explore</p>
                <p className="mt-1 text-caption">Pick up where you left off across Learnova</p>
              </div>
              <DashboardQuickActions
                actions={[
                  { label: 'Learning', href: APP_ROUTES.STUDENT_PROGRESS, icon: BookOpen },
                  { label: 'Assignments', href: APP_ROUTES.STUDENT_ASSIGNMENTS, icon: CalendarClock },
                  { label: 'Grades', href: APP_ROUTES.STUDENT_GRADES, icon: Award },
                  { label: 'Certificates', href: APP_ROUTES.STUDENT_CERTIFICATES, icon: GraduationCap },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardPage>
  );
}
