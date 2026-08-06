'use client';

import { Input } from '@learnova/ui';
import { ImageIcon, LayoutTemplate, MonitorSmartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useId, useState } from 'react';
import { cn } from '@/lib/utils';

interface BrandingUploadProps {
  logo: string | null | undefined;
  favicon: string | null | undefined;
  onChange: (next: { logo: string | null; favicon: string | null }) => void;
  disabled?: boolean;
  /** Shown in live previews when logo is absent. */
  institutionName?: string;
  shortName?: string;
}

function isLikelyUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function Mark({
  logo,
  shortName,
  size = 'md',
}: {
  logo?: string | null;
  shortName?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dims = size === 'lg' ? 'size-14' : size === 'sm' ? 'size-7' : 'size-10';
  const text = size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-[10px]' : 'text-xs';

  if (logo && isLikelyUrl(logo)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt=""
        className={cn(dims, 'rounded-xl object-contain bg-background/80 p-1 shadow-soft-sm')}
      />
    );
  }

  return (
    <span
      className={cn(
        dims,
        text,
        'inline-flex items-center justify-center rounded-xl bg-brand-gradient font-bold text-white shadow-glow',
      )}
    >
      {(shortName ?? 'LN').slice(0, 2).toUpperCase()}
    </span>
  );
}

export function BrandingUpload({
  logo,
  favicon,
  onChange,
  disabled,
  institutionName = 'Your institution',
  shortName = 'LN',
}: BrandingUploadProps) {
  const logoId = useId();
  const faviconId = useId();
  const [logoDraft, setLogoDraft] = useState(logo ?? '');
  const [faviconDraft, setFaviconDraft] = useState(favicon ?? '');

  useEffect(() => {
    setLogoDraft(logo ?? '');
    setFaviconDraft(favicon ?? '');
  }, [logo, favicon]);

  const commit = (nextLogo: string, nextFavicon: string) => {
    onChange({
      logo: nextLogo.trim() ? nextLogo.trim() : null,
      favicon: nextFavicon.trim() ? nextFavicon.trim() : null,
    });
  };

  const logoOk = Boolean(logoDraft && isLikelyUrl(logoDraft));
  const faviconOk = Boolean(faviconDraft && isLikelyUrl(faviconDraft));

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-soft-md"
      >
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
          <span className="size-2.5 rounded-full bg-danger/70" />
          <span className="size-2.5 rounded-full bg-warning/70" />
          <span className="size-2.5 rounded-full bg-success/70" />
          <div className="ml-2 flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border/70 bg-background px-2.5 py-1">
            {faviconOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={faviconDraft} alt="" className="size-3.5 object-contain" />
            ) : (
              <span className="size-3.5 rounded-sm bg-muted" />
            )}
            <span className="truncate text-[11px] text-muted-foreground">
              {institutionName} · Learnova
            </span>
          </div>
        </div>

        <div className="grid min-h-[180px] sm:grid-cols-[140px_minmax(0,1fr)]">
          <aside className="hidden border-r border-border bg-sidebar p-3 sm:block">
            <div className="mb-4 flex items-center gap-2">
              <Mark logo={logoOk ? logoDraft : null} shortName={shortName} size="sm" />
              <span className="truncate text-xs font-semibold">{shortName}</span>
            </div>
            <div className="space-y-1.5">
              {['Dashboard', 'Campuses', 'Programs'].map((item) => (
                <div
                  key={item}
                  className={cn(
                    'rounded-lg px-2 py-1.5 text-[11px]',
                    item === 'Dashboard'
                      ? 'bg-sidebar-accent font-medium text-sidebar-primary'
                      : 'text-muted-foreground',
                  )}
                >
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <div className="bg-hero p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Mark logo={logoOk ? logoDraft : null} shortName={shortName} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold tracking-tight sm:text-base">
                    {institutionName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Live brand preview</p>
                </div>
              </div>
              <MonitorSmartphone className="hidden size-4 text-muted-foreground sm:block" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl border border-border/60 bg-background/70 shadow-soft-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="size-4 text-primary" />
            <label htmlFor={logoId} className="text-sm font-medium">
              Logo URL
            </label>
          </div>
          <Input
            id={logoId}
            type="url"
            placeholder="https://cdn.example.com/logo.png"
            value={logoDraft}
            disabled={disabled}
            onChange={(e) => {
              setLogoDraft(e.target.value);
              commit(e.target.value, faviconDraft);
            }}
          />
          <div
            className={cn(
              'relative flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-dashed',
              logoOk ? 'border-primary/30 bg-primary/[0.04]' : 'border-border bg-muted/30',
            )}
          >
            {logoOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoDraft}
                alt="Institution logo preview"
                className="max-h-24 max-w-[80%] object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImageIcon className="size-6 opacity-60" />
                <span className="text-xs">Paste a hosted logo URL</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            <label htmlFor={faviconId} className="text-sm font-medium">
              Favicon URL
            </label>
          </div>
          <Input
            id={faviconId}
            type="url"
            placeholder="https://cdn.example.com/favicon.ico"
            value={faviconDraft}
            disabled={disabled}
            onChange={(e) => {
              setFaviconDraft(e.target.value);
              commit(logoDraft, e.target.value);
            }}
          />
          <div
            className={cn(
              'relative flex h-32 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed',
              faviconOk ? 'border-primary/30 bg-primary/[0.04]' : 'border-border bg-muted/30',
            )}
          >
            {faviconOk ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={faviconDraft} alt="Favicon preview" className="size-12 object-contain" />
                <span className="text-[11px] text-muted-foreground">Browser tab icon</span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <span className="size-10 rounded-lg border border-border bg-background" />
                <span className="text-xs">Paste a favicon URL</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
