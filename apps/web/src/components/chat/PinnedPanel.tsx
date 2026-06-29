import React from 'react';
import { PinOff } from 'lucide-react';
import { motion } from 'framer-motion';

export function PinnedPanel() {
  // Use message store to get pinned messages
  // Stub for now
  const pinnedMessages: any[] = [];

  return (
    <div className="h-full bg-haven-bg flex flex-col border-l border-haven-border w-80">
      <div className="p-4 border-b border-haven-border bg-haven-surface">
        <h2 className="text-sm font-semibold text-haven-text">Pinned Messages</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {pinnedMessages.length === 0 ? (
          <div className="text-center text-sm text-haven-text-secondary mt-8">
            No pinned messages yet.
          </div>
        ) : (
          pinnedMessages.map((msg) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-haven-surface border border-haven-border rounded-xl p-3 relative group"
            >
              <p className="text-sm text-haven-text line-clamp-3">{msg.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-haven-text-secondary">Oct 24</span>
                <button 
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-haven-text-secondary hover:text-haven-destructive"
                  title="Unpin message"
                >
                  <PinOff className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
