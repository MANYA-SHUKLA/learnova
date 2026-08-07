'use client';

import { Button } from '@learnova/ui';
import { Languages } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { locales, type AppLocale } from '@/lib/i18n/config';
import { usePathname, useRouter } from '@/lib/i18n/routing';
import { cn } from '@/lib/utils';

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'EN',
  hi: 'HI',
  te: 'TE',
};

const LOCALE_NAMES: Record<AppLocale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
};

interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'icon';
}

export function LanguageToggle({ className, size = 'sm' }: LanguageToggleProps) {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setMenuPos(null);
      return;
    }

    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPos({
        top: rect.bottom + 6,
        right: window.innerWidth - rect.right,
      });
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const switchLocale = (next: AppLocale) => {
    setOpen(false);
    if (next === locale) return;
    const query = window.location.search;
    const href = query ? `${pathname}${query}` : pathname;
    router.replace(href, { locale: next });
  };

  const menu =
    open && mounted && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label="Language"
            style={{ top: menuPos.top, right: menuPos.right }}
            className="fixed z-[100] min-w-[9.5rem] overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-soft-md"
          >
            {locales.map((code) => (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={code === locale}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  code === locale
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-foreground hover:bg-muted',
                )}
                onClick={() => switchLocale(code)}
              >
                <span>{LOCALE_NAMES[code]}</span>
                <span className="text-xs text-muted-foreground">{LOCALE_LABELS[code]}</span>
              </button>
            ))}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={cn('relative', className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size={size === 'icon' ? 'icon' : 'sm'}
        aria-label="Switch language"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className={cn(size === 'sm' && 'gap-1.5 px-2.5')}
      >
        <Languages className="size-4" />
        {size === 'sm' ? (
          <span className="text-xs font-semibold">{LOCALE_LABELS[locale]}</span>
        ) : null}
      </Button>
      {menu}
    </div>
  );
}
