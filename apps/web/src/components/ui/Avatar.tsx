import React from 'react';
import { cn } from './Button';

interface AvatarProps {
  src?: string | null;
  initials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  className?: string;
}

export function Avatar({ src, initials, size = 'md', isOnline, className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const statusDotSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4 outline-[3px]',
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full overflow-hidden bg-haven-surface border border-haven-border font-medium text-haven-text',
          sizes[size]
        )}
      >
        {src ? (
          <img src={src} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          initials?.toUpperCase().substring(0, 2) || '?'
        )}
      </div>
      {isOnline !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full outline outline-2 outline-haven-bg',
            isOnline ? 'bg-haven-success' : 'bg-haven-text-secondary',
            statusDotSizes[size]
          )}
        />
      )}
    </div>
  );
}
