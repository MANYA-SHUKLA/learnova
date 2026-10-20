import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@learnova/constants';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function LegacySuperAdminRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}${APP_ROUTES.CONSOLE}`);
}
