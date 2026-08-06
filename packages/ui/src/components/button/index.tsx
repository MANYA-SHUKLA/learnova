import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'box-border select-none whitespace-nowrap rounded-xl',
    'border-2 border-solid',
    'text-sm font-semibold leading-normal tracking-tight',
    'no-underline hover:no-underline visited:no-underline',
    'transition-[color,background-color,border-color,box-shadow] duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'border-primary bg-primary text-primary-foreground',
          'shadow-soft-sm',
          'hover:border-[hsl(var(--primary-hover))] hover:bg-[hsl(var(--primary-hover))]',
        ].join(' '),
        secondary: [
          'border-secondary bg-secondary text-secondary-foreground',
          'shadow-soft-sm',
          'hover:bg-secondary/90',
        ].join(' '),
        outline: [
          'border-border bg-background text-foreground',
          'shadow-none',
          'hover:border-foreground/25 hover:bg-muted',
        ].join(' '),
        ghost: 'border-transparent bg-transparent text-foreground shadow-none hover:bg-muted',
        danger: 'border-danger bg-danger text-danger-foreground shadow-soft-sm hover:bg-danger/90',
        success:
          'border-success bg-success text-success-foreground shadow-soft-sm hover:bg-success/90',
        link: 'rounded-none border-transparent bg-transparent px-0 py-0 text-primary shadow-none underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-11 px-6 py-2.5',
        sm: 'min-h-9 rounded-lg px-4 py-2 text-xs',
        lg: 'min-h-[3.25rem] px-10 py-3.5 text-base',
        icon: 'size-10 shrink-0 border-transparent p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
export { Button as default };
