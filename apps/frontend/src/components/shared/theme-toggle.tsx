'use client';

import { Button } from '@learnova/ui';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMountedTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';

type ThemeValue = 'light' | 'dark' | 'system';

const THEME_OPTIONS: {
  value: ThemeValue;
  icon: typeof Sun;
  labelKey: 'themeLight' | 'themeDark' | 'themeSystem';
}[] = [
  { value: 'light', icon: Sun, labelKey: 'themeLight' },
  { value: 'dark', icon: Moon, labelKey: 'themeDark' },
  { value: 'system', icon: Monitor, labelKey: 'themeSystem' },
];

export function ThemeToggle() {
  const t = useTranslations('common');
  const { theme, setTheme, resolvedTheme, mounted } = useMountedTheme();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeTheme = (theme ?? 'system') as ThemeValue;
  const isDark = resolvedTheme === 'dark';

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

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label={t('theme')} disabled />;
  }

  const menu =
    open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={t('theme')}
            style={{ top: menuPos.top, right: menuPos.right }}
            className="fixed z-[100] min-w-[10.5rem] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-soft-md"
          >
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = activeTheme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    selected
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-foreground hover:bg-muted',
                  )}
                  onClick={() => {
                    setTheme(option.value);
                    setOpen(false);
                  }}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{t(option.labelKey)}</span>
                  {selected ? <Check className="size-3.5 shrink-0" /> : null}
                </button>
              );
            })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="relative">
      <Button
        ref={triggerRef}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t('theme')}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      {menu}
    </div>
  );
}
