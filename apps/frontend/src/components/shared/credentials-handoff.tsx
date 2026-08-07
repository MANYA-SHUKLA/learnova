'use client';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@learnova/ui';
import { Download, Printer, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export type ProvisionedCredentials = {
  title?: string;
  displayIdLabel: string;
  displayId: string;
  email: string;
  temporaryPassword: string;
};

interface CredentialsHandoffProps {
  credentials: ProvisionedCredentials;
  onDone: () => void;
}

function credentialsText(c: ProvisionedCredentials) {
  return [
    'Learnova — Account credentials',
    '--------------------------------',
    `${c.displayIdLabel}: ${c.displayId}`,
    `Email: ${c.email}`,
    `Temporary Password: ${c.temporaryPassword}`,
    '--------------------------------',
    'Sign in at /login and change your password on first login.',
  ].join('\n');
}

export function CredentialsHandoff({ credentials, onDone }: CredentialsHandoffProps) {
  const [copied, setCopied] = useState(false);
  const text = credentialsText(credentials);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const print = () => {
    const win = window.open('', '_blank', 'noopener,noreferrer,width=640,height=720');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>Credentials</title>
      <style>
        body{font-family:ui-sans-serif,system-ui,sans-serif;padding:2rem;line-height:1.5}
        pre{white-space:pre-wrap;border:1px solid #ddd;padding:1rem;border-radius:8px}
        h1{font-size:1.25rem}
      </style></head><body>
      <h1>${credentials.title ?? 'Account created successfully'}</h1>
      <pre>${text.replace(/</g, '&lt;')}</pre>
      <p>Deliver these credentials securely. The temporary password is shown only once.</p>
      <script>window.onload=()=>window.print()</script>
      </body></html>`);
    win.document.close();
  };

  const downloadPdf = () => {
    // Lightweight printable HTML download — admin can Save as PDF from print dialog.
    // Avoids adding a PDF dependency for this one-time handoff.
    print();
  };

  return (
    <Card className="mx-auto w-full max-w-lg rounded-2xl border-border/80 shadow-soft-lg">
      <CardHeader>
        <CardTitle>{credentials.title ?? 'Created successfully'}</CardTitle>
        <CardDescription>
          A copy was emailed to {credentials.email}. The temporary password is shown only once
          here and is never stored in plain text.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <pre className="overflow-x-auto rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed">
          {text}
        </pre>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void copy()}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy credentials'}
          </Button>
          <Button type="button" variant="outline" onClick={print}>
            <Printer className="size-4" />
            Print
          </Button>
          <Button type="button" variant="outline" onClick={downloadPdf}>
            <Download className="size-4" />
            Download / Save PDF
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          They must sign in and change the password on first login. Keep a backup copy in case
          the email is delayed.
        </p>
        <Button type="button" className="w-full" onClick={onDone}>
          Done
        </Button>
      </CardContent>
    </Card>
  );
}
