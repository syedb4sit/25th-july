import React from 'react';
import { cn } from './Button';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accent' | 'destructive' | 'success';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-haven-surface text-haven-text-secondary border border-haven-border',
    accent: 'bg-haven-accent/10 text-haven-accent',
    destructive: 'bg-haven-destructive/10 text-haven-destructive',
    success: 'bg-haven-success/10 text-haven-success',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
