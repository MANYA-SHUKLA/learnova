import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'box-border select-none whitespace-nowrap rounded-lg',
    'text-sm font-semibold leading-5',
    'no-underline hover:no-underline',
    'transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'border border-transparent bg-primary text-primary-foreground shadow-soft-sm hover:bg-[hsl(var(--primary-hover))]',
        secondary:
          'border border-transparent bg-secondary text-secondary-foreground shadow-soft-sm hover:bg-secondary/90',
        outline:
          'border border-solid border-border bg-background text-foreground shadow-none hover:bg-muted',
        ghost:
          'border border-transparent bg-transparent text-foreground hover:bg-muted',
        danger:
          'border border-transparent bg-danger text-danger-foreground shadow-soft-sm hover:bg-danger/90',
        success:
          'border border-transparent bg-success text-success-foreground shadow-soft-sm hover:bg-success/90',
        link: 'border-0 bg-transparent px-0 text-primary shadow-none underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-5 py-2.5',
        sm: 'px-3.5 py-2 text-xs leading-4',
        lg: 'px-8 py-3.5 text-base leading-6',
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
