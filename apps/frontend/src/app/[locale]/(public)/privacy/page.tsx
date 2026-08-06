import { setRequestLocale } from 'next-intl/server';
import { LegalPageShell, LegalSection } from '@/components/marketing/legal-page-shell';
import { Link } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PrivacyPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalPageShell
      activeHref="/privacy"
      title="Privacy Policy"
      description="How Learnova collects, uses, and protects personal and institutional data across the platform."
    >
      <LegalSection title="1. Overview">
        <p>
          Learnova (“we”, “us”) is an enterprise AI learning platform for institutions. This Privacy
          Policy explains what information we process when you use Learnova websites, dashboards, and
          related services.
        </p>
        <p>
          For questions, contact{' '}
          <a
            href="mailto:shuklamanya99@gmail.com"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            shuklamanya99@gmail.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>Depending on how you use Learnova, we may process:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account details such as name, email address, role, and institution affiliation</li>
          <li>Academic structure data (campuses, programs, batches) entered by administrators</li>
          <li>Usage and device information needed for sessions, security, and product reliability</li>
          <li>Support messages you send to us</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use information">
        <p>We use information to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Provide authentication, dashboards, and institution management features</li>
          <li>Send transactional email such as verification and password reset links</li>
          <li>Improve reliability, accessibility, and user experience</li>
          <li>Protect against abuse and unauthorized access</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Sharing">
        <p>
          We do not sell personal data. We may share information with service providers that help us
          operate Learnova (for example hosting or email delivery), only as needed to provide the
          service, or when required by law.
        </p>
      </LegalSection>

      <LegalSection title="5. Retention & security">
        <p>
          We retain account and institutional records for as long as needed to operate the service or
          as required by institutional policy. Security practices are described on our{' '}
          <Link href="/security" className="font-medium text-foreground underline-offset-2 hover:underline">
            Security
          </Link>{' '}
          page.
        </p>
      </LegalSection>

      <LegalSection title="6. Your choices">
        <p>
          You may request access, correction, or deletion of personal account data by contacting us.
          Institution administrators control academic records within their tenant.
        </p>
      </LegalSection>

      <LegalSection title="7. Changes">
        <p>
          We may update this policy from time to time. Material changes will be reflected by updating
          the “Last updated” date on this page.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
