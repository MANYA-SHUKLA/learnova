import * as AvatarPrimitive from '@radix-ui/react-avatar';
import * as React from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  fallback?: string;
}

export function Avatar({ className, fallback, children, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        'relative flex size-9 shrink-0 overflow-hidden rounded-full border border-border/80 bg-muted',
        className,
      )}
      {...props}
    >
      {children}
      {fallback ? (
        <AvatarPrimitive.Fallback
          className="flex size-full items-center justify-center bg-primary/10 text-xs font-semibold text-primary"
          delayMs={0}
        >
          {fallback}
        </AvatarPrimitive.Fallback>
      ) : null}
    </AvatarPrimitive.Root>
  );
}

export function AvatarImage(props: React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image className="aspect-square size-full object-cover" {...props} />;
}
