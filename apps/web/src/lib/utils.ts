import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * Merge Tailwind CSS classes with clsx, resolving conflicts via tailwind-merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as a human-readable relative time string (e.g. "3 minutes ago").
 */
export function formatRelativeTime(date: Date | number): string {
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format a date into HH:mm (24-hour) format.
 */
export function formatTime(date: Date | number): string {
  return format(date, 'HH:mm');
}

/**
 * Generate a random ID string suitable for local identifiers.
 * Produces a 21-character alphanumeric string.
 */
export function generateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(21);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}
