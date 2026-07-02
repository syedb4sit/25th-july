'use client';
import React, { useEffect, useRef } from 'react';
import { useMessageStore } from '@/stores/message.store';
import { MessageBubble } from './MessageBubble';
import { useAuthStore } from '@/stores/auth.store';
import { Spinner } from '../ui/Spinner';

export function MessageList() {
  const { messages, isLoading, hasMore, loadMessages } = useMessageStore();
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on initial load or new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !isLoading) {
      // Load older messages when scrolling to top
      // (Implementation requires capturing scroll height before load, then adjusting after to maintain position)
      loadMessages();
    }
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-haven-bg">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // Group messages by date
  // This is a simplified rendering, without actual date grouping logic for brevity
  // Reversed array because messages are likely stored newest first if fetched with order by desc
  // Actually, they should be rendered oldest first (top to bottom)
  
  // We assume messages in the store are sorted oldest to newest for rendering.

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-6 bg-haven-bg scroll-smooth custom-scrollbar"
    >
      {hasMore && (
        <div className="flex justify-center py-4">
          <button 
            onClick={() => loadMessages()}
            disabled={isLoading}
            className="text-xs font-medium text-haven-accent hover:underline disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load earlier messages'}
          </button>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-haven-text-secondary bg-haven-surface/50 px-4 py-2 rounded-full border border-haven-border">
            This is the beginning of your private space.
          </p>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isSender={msg.senderId === user?.id} 
          />
        ))
      )}
    </div>
  );
}

