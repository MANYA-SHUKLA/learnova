import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'whitespace-nowrap rounded-xl text-sm font-semibold leading-none',
    'border border-transparent',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-soft-md hover:bg-[hsl(var(--primary-hover))] hover:shadow-soft-lg',
        secondary:
          'bg-secondary text-secondary-foreground shadow-soft-sm hover:bg-secondary/90',
        outline:
          'border-border bg-background text-foreground shadow-none hover:border-primary/30 hover:bg-muted/60',
        ghost: 'hover:bg-muted hover:text-foreground',
        danger: 'bg-danger text-danger-foreground shadow-soft-sm hover:bg-danger/90',
        success: 'bg-success text-success-foreground shadow-soft-sm hover:bg-success/90',
        link: 'border-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-10 px-5 py-2.5',
        sm: 'min-h-8 rounded-lg px-3.5 py-2 text-xs',
        lg: 'min-h-12 rounded-2xl px-8 py-3.5 text-base',
        icon: 'size-10 shrink-0 p-0',
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
