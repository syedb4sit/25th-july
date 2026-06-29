import { Loader2 } from 'lucide-react';
import { cn } from './Button';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin text-haven-accent", className)} />;
}
