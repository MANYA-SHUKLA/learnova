import { setRequestLocale } from 'next-intl/server';
import { LegalPageShell, LegalSection } from '@/components/marketing/legal-page-shell';
import { Link } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function TermsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalPageShell
      activeHref="/terms"
      title="Terms of Service"
      description="The rules for using Learnova websites, accounts, and institutional workspaces."
    >
      <LegalSection title="1. Agreement">
        <p>
          By accessing or using Learnova, you agree to these Terms of Service. If you use Learnova on
          behalf of an institution, you represent that you have authority to bind that institution.
        </p>
      </LegalSection>

      <LegalSection title="2. The service">
        <p>
          Learnova provides learning and academic operations software, including institution
          structure, authentication, and related modules. Features may evolve as the product develops.
          Some capabilities may be preview, limited, or unavailable depending on your plan and
          deployment.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts & access">
        <ul className="list-disc space-y-2 pl-5">
          <li>You are responsible for safeguarding credentials and session devices</li>
          <li>Provide accurate registration information</li>
          <li>Notify us promptly of unauthorized account use</li>
          <li>Institution admins are responsible for user provisioning within their tenant</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Attempt to bypass authentication, authorization, or audit controls</li>
          <li>Probe, disrupt, or overload the service except through approved testing</li>
          <li>Upload unlawful, harmful, or infringing content</li>
          <li>Misrepresent your identity or affiliation</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Institutional data">
        <p>
          Academic and organizational data entered into Learnova remains under the control of the
          institution that owns the tenant, subject to these Terms and our{' '}
          <Link href="/privacy" className="font-medium text-foreground underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Intellectual property">
        <p>
          Learnova branding, software, and documentation are protected by applicable IP laws. You
          receive a limited right to use the service; you do not acquire ownership of the platform.
        </p>
      </LegalSection>

      <LegalSection title="7. Disclaimer">
        <p>
          Learnova is provided on an “as available” basis for evaluation and academic use. To the
          fullest extent permitted by law, we disclaim warranties of uninterrupted availability or
          fitness for a particular purpose.
        </p>
      </LegalSection>

      <LegalSection title="8. Contact">
        <p>
          Questions about these Terms:{' '}
          <a
            href="mailto:shuklamanya99@gmail.com"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            shuklamanya99@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
