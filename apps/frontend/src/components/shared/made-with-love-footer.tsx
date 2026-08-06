import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MadeWithLoveFooterProps {
  className?: string;
}

export function MadeWithLoveFooter({ className }: MadeWithLoveFooterProps) {
  return (
    <footer
      className={cn(
        'border-t border-border bg-muted/30 px-4 py-4 text-center print:hidden',
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
          by <span className="font-medium text-foreground">Manya Shukla</span> · 2026 · SOE JNU
          Minor Project
        </span>
      </p>
    </footer>
  );
}
