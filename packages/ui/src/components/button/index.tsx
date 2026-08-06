import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'box-border select-none whitespace-nowrap rounded-xl',
    'text-sm font-semibold leading-snug tracking-tight',
    'no-underline hover:no-underline visited:no-underline',
    'transition-[color,background-color,box-shadow] duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        default: [
          'bg-primary text-primary-foreground',
          'shadow-[0_1px_2px_rgb(15_23_42_/_0.08)]',
          'hover:bg-[hsl(var(--primary-hover))]',
        ].join(' '),
        secondary: [
          'bg-secondary text-secondary-foreground',
          'shadow-[0_1px_2px_rgb(15_23_42_/_0.08)]',
          'hover:bg-secondary/90',
        ].join(' '),
        outline: [
          'bg-background text-foreground',
          /* inset stroke — does not shrink the text box / overlap glyphs */
          'shadow-[inset_0_0_0_1.5px_hsl(var(--border))]',
          'hover:bg-muted hover:shadow-[inset_0_0_0_1.5px_hsl(var(--foreground)_/_0.18)]',
        ].join(' '),
        ghost: 'bg-transparent text-foreground hover:bg-muted',
        danger: 'bg-danger text-danger-foreground hover:bg-danger/90',
        success: 'bg-success text-success-foreground hover:bg-success/90',
        link: 'rounded-none bg-transparent px-0 py-0 text-primary shadow-none underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-10 px-5 py-2.5',
        sm: 'min-h-8 rounded-lg px-3.5 py-2 text-xs',
        lg: 'min-h-12 px-8 py-3.5 text-base',
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
