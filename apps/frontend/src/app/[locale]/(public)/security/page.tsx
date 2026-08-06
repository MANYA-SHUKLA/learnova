import { setRequestLocale } from 'next-intl/server';
import { LegalPageShell, LegalSection } from '@/components/marketing/legal-page-shell';
import { Link } from '@/lib/i18n/routing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SecurityPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalPageShell
      activeHref="/security"
      title="Security"
      description="How Learnova approaches authentication, access control, and protecting institutional data."
    >
      <LegalSection title="1. Our approach">
        <p>
          Security is foundational to Learnova. We design for institutional trust: clear roles,
          session hygiene, and auditable actions across the academic workspace.
        </p>
      </LegalSection>

      <LegalSection title="2. Authentication & sessions">
        <ul className="list-disc space-y-2 pl-5">
          <li>Password-based sign-in with hashed credential storage</li>
          <li>JWT access tokens with rotating refresh cookies</li>
          <li>Session listing and revocation for signed-in devices</li>
          <li>Email verification and password reset flows</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Authorization">
        <p>
          Role-based access control (RBAC) gates sensitive institution and academic operations.
          Permissions such as institution read/manage are enforced in the API layer, not only in the
          UI.
        </p>
      </LegalSection>

      <LegalSection title="4. Data protection practices">
        <ul className="list-disc space-y-2 pl-5">
          <li>Transport encryption via HTTPS in production deployments</li>
          <li>Environment-separated secrets and configuration</li>
          <li>Soft-delete patterns for recoverable institutional records</li>
          <li>Audit logging for key authentication and management events</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Responsible disclosure">
        <p>
          If you believe you have found a security issue, please email{' '}
          <a
            href="mailto:shuklamanya99@gmail.com"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            shuklamanya99@gmail.com
          </a>{' '}
          with steps to reproduce. Do not publicly disclose vulnerabilities until we have had a
          reasonable chance to investigate and remediate.
        </p>
      </LegalSection>

      <LegalSection title="6. Related policies">
        <p>
          See also our{' '}
          <Link href="/privacy" className="font-medium text-foreground underline-offset-2 hover:underline">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/terms" className="font-medium text-foreground underline-offset-2 hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
