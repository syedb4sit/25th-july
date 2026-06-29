"use client";

import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/chat/Sidebar';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  // Initialize WebSocket connection
  useWebSocket();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-haven-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-haven-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-haven-bg">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
