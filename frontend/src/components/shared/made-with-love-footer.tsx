'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { siteGutter } from '@/lib/layout';
import { cn } from '@/lib/utils';

interface MadeWithLoveFooterProps {
  className?: string;
}

export function MadeWithLoveFooter({ className }: MadeWithLoveFooterProps) {
  const t = useTranslations('common.madeWithLove');

  return (
    <footer
      className={cn(
        'mt-auto w-full shrink-0 border-t border-border bg-muted/30 py-4 text-center print:hidden',
        siteGutter,
        className,
      )}
    >
      <p className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground sm:text-sm">
        <span>{t('madeWith')}</span>
        <Heart className="size-3.5 fill-danger text-danger" aria-hidden />
        <span>
          {t('by')}{' '}
          <a
            href="https://wa.me/918005586588"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Manya Shukla
          </a>
          {' · '}
          {t('project')}
        </span>
      </p>
    </footer>
  );
}
