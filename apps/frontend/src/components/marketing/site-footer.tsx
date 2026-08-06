import { siteContainer } from '@/lib/layout';
import { Link } from '@/lib/i18n/routing';
import { LogoMark } from './logo-mark';

const PRODUCT_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#coding-labs', label: 'Coding Labs' },
  { href: '/#ai', label: 'AI Ideation' },
  { href: '/#exams', label: 'Exams' },
  { href: '/#analytics', label: 'Analytics' },
] as const;

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/#pricing', label: 'Pricing' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/login', label: 'Sign in' },
] as const;

const LEGAL_LINKS = [
  { href: '/about', label: 'Privacy' },
  { href: '/about', label: 'Terms' },
  { href: '/about', label: 'Security' },
] as const;

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={`${title}-${link.label}`}>
            <Link
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border bg-muted/40">
      <div className={siteContainer('py-14 sm:py-16')}>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-16">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-foreground"
            >
              <LogoMark />
              Learnova
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
              The enterprise AI learning platform for institutions that teach, assess, and innovate at
              scale.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Contact:{' '}
              <a
                href="mailto:shuklamanya99@gmail.com"
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                shuklamanya99@gmail.com
              </a>
            </p>
          </div>
          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            © {year} Learnova. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
