import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@learnova/constants';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function LegacySuperAdminLoginRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}${APP_ROUTES.CONSOLE_SIGN_IN}`);
}
