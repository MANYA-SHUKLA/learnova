import { Heart } from 'lucide-react';
import { siteGutter } from '@/lib/layout';
import { cn } from '@/lib/utils';

interface MadeWithLoveFooterProps {
  className?: string;
}

export function MadeWithLoveFooter({ className }: MadeWithLoveFooterProps) {
  return (
    <footer
      className={cn(
        'mt-auto w-full shrink-0 border-t border-border bg-muted/30 py-4 text-center',
        siteGutter,
        className,
      )}
    >
      <p className="inline-flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground sm:text-sm">
        <span>Made with</span>
        <Heart
          className="size-3.5 fill-danger text-danger"
          aria-hidden
        />
        <span>
          by{' '}
          <a
            href="https://wa.me/918005586588"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            Manya Shukla
          </a>
          {' · '}
          2026 · SOE JNU Minor Project
        </span>
      </p>
    </footer>
  );
}
