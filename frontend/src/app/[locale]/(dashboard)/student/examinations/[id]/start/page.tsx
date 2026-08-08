import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@learnova/constants';

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function StudentExamStartPage({ params }: PageProps) {
  const { id, locale } = await params;
  redirect(`/${locale}${APP_ROUTES.STUDENT_EXAM_CHECKIN.replace(':id', id)}`);
}
