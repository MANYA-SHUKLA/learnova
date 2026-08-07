'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { UserRound, Users, BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { RoleWelcome } from '@/components/shared/role-welcome';

export default function FacultyDashboardPage() {
  const t = useTranslations('dashboard.facultyHome');

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
          t('modules.students'),
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
              View and update your faculty profile information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={APP_ROUTES.FACULTY_PROFILE}>View profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <CardTitle className="text-base">My Students</CardTitle>
            <CardDescription>
              View and manage students you teach or mentor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href={APP_ROUTES.INSTITUTION_STUDENTS}>View students</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/80">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="size-5 text-primary" />
            </div>
            <CardTitle className="text-base">Courses</CardTitle>
            <CardDescription>
              Course management and content (coming soon)
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
