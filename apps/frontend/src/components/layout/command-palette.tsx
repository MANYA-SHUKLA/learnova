'use client';

import { APP_ROUTES } from '@learnova/constants';
import { Input } from '@learnova/ui';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { useAuth } from '@/providers/auth-provider';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  href: string;
  group: string;
}

function navForRole(role: string | undefined): CommandItem[] {
  const institution: CommandItem[] = [
    { id: 'idash', label: 'Dashboard', href: APP_ROUTES.INSTITUTION_DASHBOARD, group: 'Institution' },
    { id: 'icampus', label: 'Campuses', href: APP_ROUTES.INSTITUTION_CAMPUSES, group: 'Institution' },
    { id: 'istudents', label: 'Students', href: APP_ROUTES.INSTITUTION_STUDENTS, group: 'People' },
    { id: 'ifaculty', label: 'Faculty', href: APP_ROUTES.INSTITUTION_FACULTY, group: 'People' },
    { id: 'icourses', label: 'Courses', href: APP_ROUTES.INSTITUTION_COURSES, group: 'Learning' },
    { id: 'igrade', label: 'Gradebook', href: APP_ROUTES.INSTITUTION_GRADEBOOK, group: 'Learning' },
    { id: 'icert', label: 'Certificates', href: APP_ROUTES.INSTITUTION_CERTIFICATES, group: 'Learning' },
    { id: 'isettings', label: 'Settings', href: APP_ROUTES.INSTITUTION_SETTINGS, group: 'System' },
  ];

  const faculty: CommandItem[] = [
    { id: 'fdash', label: 'Dashboard', href: APP_ROUTES.FACULTY_DASHBOARD, group: 'Faculty' },
    { id: 'fcourses', label: 'My Courses', href: APP_ROUTES.FACULTY_ENROLLMENTS, group: 'Faculty' },
    { id: 'fassign', label: 'Assignments', href: APP_ROUTES.FACULTY_ASSIGNMENTS, group: 'Teaching' },
    { id: 'fgrade', label: 'Gradebook', href: APP_ROUTES.FACULTY_GRADEBOOK, group: 'Teaching' },
    { id: 'fexams', label: 'Exams', href: APP_ROUTES.FACULTY_EXAMS, group: 'Teaching' },
    { id: 'fprojects', label: 'Projects', href: APP_ROUTES.FACULTY_PROJECTS, group: 'Teaching' },
    { id: 'fprofile', label: 'Profile', href: APP_ROUTES.FACULTY_PROFILE, group: 'Account' },
  ];

  const student: CommandItem[] = [
    { id: 'sdash', label: 'Dashboard', href: APP_ROUTES.STUDENT_DASHBOARD, group: 'Student' },
    { id: 'scourses', label: 'Courses', href: APP_ROUTES.STUDENT_ENROLLMENTS, group: 'Student' },
    { id: 'slearn', label: 'Learning', href: APP_ROUTES.STUDENT_PROGRESS, group: 'Student' },
    { id: 'sassign', label: 'Assignments', href: APP_ROUTES.STUDENT_ASSIGNMENTS, group: 'Work' },
    { id: 'sgrades', label: 'Grades', href: APP_ROUTES.STUDENT_GRADES, group: 'Work' },
    { id: 'scert', label: 'Certificates', href: APP_ROUTES.STUDENT_CERTIFICATES, group: 'Work' },
    { id: 'sprofile', label: 'Profile', href: APP_ROUTES.STUDENT_PROFILE, group: 'Account' },
  ];

  if (role === 'faculty') return faculty;
  if (role === 'student') return student;
  if (role === 'institution_admin') return institution;
  return institution;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggle = useUIStore((s) => s.toggleCommandPalette);
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations('common');

  const items = useMemo(() => navForRole(user?.role), [user?.role]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen, toggle]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        aria-label={t('close')}
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('search')}
        className="absolute left-1/2 top-[12vh] w-[min(100vw-2rem,32rem)] -translate-x-1/2 overflow-hidden rounded-2xl border border-border/80 bg-popover shadow-soft-lg"
      >
        <div className="flex items-center gap-2 border-b border-border/80 px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`${t('search')}…`}
            className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t('close')}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[min(50vh,20rem)] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-caption">No matches</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.href)}
                className="flex w-full flex-col items-start rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <span className="text-label text-foreground">{item.label}</span>
                <span className="text-caption">{item.group}</span>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-border/80 px-4 py-2 text-caption">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-meta">⌘K</kbd>
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteTrigger({
  className,
}: {
  className?: string;
}) {
  const t = useTranslations('common');
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        'flex h-9 min-w-0 items-center gap-2 rounded-xl border border-border/80 bg-muted/40 px-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted lg:w-[min(100%,14rem)] xl:w-[min(100%,18rem)]',
        className,
      )}
    >
      <Search className="size-4 shrink-0" />
      <span className="hidden flex-1 truncate sm:inline">{t('search')}…</span>
      <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-meta lg:inline">
        ⌘K
      </kbd>
    </button>
  );
}
