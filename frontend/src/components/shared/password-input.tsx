'use client';

import { Input, type InputProps } from '@learnova/ui';
import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(
  ({ className, disabled, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn('pr-10', className)}
          disabled={disabled}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          onClick={() => { setVisible((v) => !v); }}
          disabled={disabled}
          aria-label={visible ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
