'use client';

import { Input } from '@learnova/ui';
import { useEffect, useId, useState } from 'react';

interface BrandingUploadProps {
  logo: string | null | undefined;
  favicon: string | null | undefined;
  onChange: (next: { logo: string | null; favicon: string | null }) => void;
  disabled?: boolean;
}

function isLikelyUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function BrandingUpload({ logo, favicon, onChange, disabled }: BrandingUploadProps) {
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

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-3">
        <label htmlFor={logoId} className="text-sm font-medium">
          Logo URL
        </label>
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
        <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
          {logoDraft && isLikelyUrl(logoDraft) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoDraft}
              alt="Institution logo preview"
              className="max-h-full max-w-full object-contain p-2"
            />
          ) : (
            <span className="text-xs text-muted-foreground">Logo preview</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor={faviconId} className="text-sm font-medium">
          Favicon URL
        </label>
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
        <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
          {faviconDraft && isLikelyUrl(faviconDraft) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={faviconDraft}
              alt="Favicon preview"
              className="size-10 object-contain"
            />
          ) : (
            <span className="text-xs text-muted-foreground">Favicon preview</span>
          )}
        </div>
      </div>
    </div>
  );
}
