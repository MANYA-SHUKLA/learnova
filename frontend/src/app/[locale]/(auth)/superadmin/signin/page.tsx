import { redirect } from 'next/navigation';
import { APP_ROUTES } from '@learnova/constants';

interface Props {
  params: Promise<{ locale: string }>;
}

/** @deprecated use `/superadmin/login` */
export default async function LegacySuperAdminSigninRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}${APP_ROUTES.SUPERADMIN_LOGIN}`);
}
