"use client";

import React from 'react';
import { useUIStore } from '@/stores/ui.store';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { PinnedPanel } from '@/components/chat/PinnedPanel';
import { MediaGallery } from '@/components/gallery/MediaGallery';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { AnimatePresence, motion } from 'framer-motion';

export default function ChatPage() {
  const { activeView } = useUIStore();

  return (
    <>
      {activeView === 'chat' || activeView === 'pinned' ? (
        <div className="flex flex-1 h-full overflow-hidden">
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0 relative">
            <ChatHeader />
            <MessageList />
            <MessageInput />
          </div>

          {/* Pinned Panel Slide-over */}
          <AnimatePresence>
            {activeView === 'pinned' && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="flex-shrink-0 border-l border-haven-border bg-haven-surface overflow-hidden"
              >
                <div className="w-80 h-full">
                  <PinnedPanel />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : activeView === 'gallery' ? (
        <MediaGallery />
      ) : activeView === 'settings' ? (
        <SettingsPanel />
      ) : null}
    </>
  );
}
