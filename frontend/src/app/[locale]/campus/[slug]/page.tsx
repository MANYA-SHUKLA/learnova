import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function LegacyCampusRedirect({ params }: Props) {
  const { locale, slug } = await params;
  redirect(`/${locale}/${slug}`);
}
