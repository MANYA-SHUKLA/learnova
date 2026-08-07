'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { UserRound, BookOpen, GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { RoleWelcome } from '@/components/shared/role-welcome';

export default function StudentDashboardPage() {
  const t = useTranslations('dashboard.studentHome');

  return (
    <div className="space-y-6">
      <RoleWelcome
        roleLabel={t('roleLabel')}
        title={t('title')}
        preparingLine={t('preparingLine')}
        modulesIntro={t('modulesIntro')}
        welcome={t('welcome')}
        welcomeNamed={(name) => t('welcomeNamed', { name })}
        contactAdmin={t('contactAdmin')}
        modules={[
          t('modules.myCourses'),
          t('modules.assignments'),
          t('modules.exams'),
          t('modules.practiceLabs'),
          t('modules.projects'),
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <UserRound className="size-5 text-primary" />
            </div>
            <CardTitle className="text-base">My Profile</CardTitle>
            <CardDescription>
              View and update your student profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={APP_ROUTES.STUDENT_PROFILE}>View profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="size-5 text-primary" />
            </div>
            <CardTitle className="text-base">My Courses</CardTitle>
            <CardDescription>
              Access your enrolled courses and materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Coming soon
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="size-5 text-primary" />
            </div>
            <CardTitle className="text-base">Continue Learning</CardTitle>
            <CardDescription>
              Resume where you left off in your studies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" className="w-full" disabled>
              Coming soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
