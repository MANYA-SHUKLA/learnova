'use client';

import { cn } from '@/lib/utils';

type IllustrationVariant = 'inbox' | 'building' | 'campus' | 'faculty' | 'student' | 'courses';

interface EmptyIllustrationProps {
  variant?: IllustrationVariant;
  className?: string;
}

export function EmptyIllustration({ variant = 'inbox', className }: EmptyIllustrationProps) {
  const common = cn('mx-auto h-28 w-40 text-primary', className);

  switch (variant) {
    case 'building':
      return (
        <svg viewBox="0 0 160 112" fill="none" className={common} aria-hidden>
          <rect x="18" y="28" width="52" height="68" rx="6" className="fill-primary/10 stroke-primary/40" strokeWidth="1.5" />
          <rect x="78" y="44" width="48" height="52" rx="6" className="fill-primary/5 stroke-primary/30" strokeWidth="1.5" />
          <path d="M34 96V72h8v24M46 96V60h8v36M90 96V68h8v28M102 96V76h8v20" className="stroke-primary/50" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="128" cy="28" r="10" className="fill-accent/20 stroke-accent/50" strokeWidth="1.5" />
          <path d="M18 96h124" className="stroke-muted-foreground/30" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'campus':
      return (
        <svg viewBox="0 0 160 112" fill="none" className={common} aria-hidden>
          <path d="M28 88 L80 36 L132 88 Z" className="fill-primary/10 stroke-primary/40" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="62" y="64" width="36" height="24" rx="3" className="fill-background stroke-primary/40" strokeWidth="1.5" />
          <path d="M20 88h120" className="stroke-muted-foreground/30" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="118" cy="40" r="8" className="fill-accent/15 stroke-accent/40" strokeWidth="1.25" />
        </svg>
      );
    case 'faculty':
      return (
        <svg viewBox="0 0 160 112" fill="none" className={common} aria-hidden>
          <circle cx="80" cy="36" r="16" className="fill-primary/10 stroke-primary/40" strokeWidth="1.5" />
          <path d="M48 88c4-20 16-28 32-28s28 8 32 28" className="fill-primary/5 stroke-primary/40" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="108" y="28" width="28" height="36" rx="4" className="fill-accent/10 stroke-accent/40" strokeWidth="1.25" />
          <path d="M114 40h16M114 48h12" className="stroke-accent/50" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
      );
    case 'student':
      return (
        <svg viewBox="0 0 160 112" fill="none" className={common} aria-hidden>
          <path d="M40 52 L80 32 L120 52 L80 72 Z" className="fill-primary/10 stroke-primary/40" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M120 52v24c-12 8-28 12-40 12s-28-4-40-12V52" className="stroke-primary/35" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M120 52l12 6v14" className="stroke-accent/50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'courses':
      return (
        <svg viewBox="0 0 160 112" fill="none" className={common} aria-hidden>
          <rect x="36" y="28" width="56" height="64" rx="6" className="fill-primary/10 stroke-primary/40" strokeWidth="1.5" />
          <rect x="68" y="36" width="56" height="64" rx="6" className="fill-background stroke-primary/30" strokeWidth="1.5" />
          <path d="M80 48h32M80 58h28M80 68h24" className="stroke-primary/40" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 160 112" fill="none" className={common} aria-hidden>
          <rect x="44" y="36" width="72" height="52" rx="10" className="fill-primary/8 stroke-primary/35" strokeWidth="1.5" />
          <path d="M56 52h48M56 64h36" className="stroke-primary/40" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="112" cy="40" r="14" className="fill-accent/15 stroke-accent/40" strokeWidth="1.25" />
          <path d="M106 40h12M112 34v12" className="stroke-accent/55" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

export type { IllustrationVariant };
