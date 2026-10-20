import type { ReactNode } from 'react';
import { MANYA_SHUKLA_WHATSAPP_URL } from '@/lib/manya-shukla-whatsapp';
import { cn } from '@/lib/utils';

export function ManyaShuklaWhatsAppLink({
  className,
  children = 'Manya Shukla',
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <a
      href={MANYA_SHUKLA_WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('underline-offset-2 hover:underline', className)}
    >
      {children}
    </a>
  );
}
