'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Check, CheckCheck, MoreHorizontal, Reply, Smile, Pin, Copy, Edit2 } from 'lucide-react';
import { ReactionPicker } from './ReactionPicker';
// import { DecryptedMessage } from '@/types'; // Assuming this is available

export function MessageBubble({ message, isSender }: { message: any; isSender: boolean }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const StatusIcon = () => {
    if (!isSender) return null;
    if (message.readAt) return <CheckCheck className="w-3.5 h-3.5 text-haven-accent" />;
    if (message.deliveredAt) return <CheckCheck className="w-3.5 h-3.5 text-haven-text-secondary" />;
    return <Check className="w-3.5 h-3.5 text-haven-text-secondary" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col ${isSender ? 'items-end' : 'items-start'} group relative`}
    >
      <div className={`flex items-end gap-2 max-w-[80%] ${isSender ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* The Bubble */}
        <div 
          className={`relative px-4 py-2.5 rounded-2xl break-words ${
            isSender 
              ? 'bg-haven-accent/15 text-haven-text border border-haven-accent/20 rounded-br-sm' 
              : 'bg-haven-surface text-haven-text border border-haven-border rounded-bl-sm'
          }`}
        >
          {/* Reply Preview (Stub) */}
          {message.replyToId && (
            <div className={`mb-2 pl-2 border-l-2 text-xs opacity-75 ${isSender ? 'border-haven-accent' : 'border-haven-text-secondary'}`}>
              Replying to message...
            </div>
          )}

          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          <div className={`flex items-center gap-1 mt-1 text-[10px] select-none ${isSender ? 'justify-end' : 'justify-start'}`}>
            <span className="text-haven-text-secondary opacity-70">
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
            {message.edited && <span className="text-haven-text-secondary opacity-50 ml-1">(edited)</span>}
            <StatusIcon />
          </div>
        </div>

        {/* Action Menu Trigger (Hover) */}
        <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isSender ? 'mr-1' : 'ml-1'}`}>
          <button 
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-1.5 rounded-full bg-haven-surface border border-haven-border text-haven-text-secondary hover:text-haven-text"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full bg-haven-surface border border-haven-border text-haven-text-secondary hover:text-haven-text"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reactions (Stub) */}
      {message.reactions && message.reactions.length > 0 && (
        <div className={`flex gap-1 mt-1 ${isSender ? 'mr-2' : 'ml-2'}`}>
          {/* Render grouped reactions here */}
          <span className="bg-haven-surface border border-haven-border rounded-full px-2 py-0.5 text-xs">
            ❤️ 1
          </span>
        </div>
      )}

      {/* Popovers */}
      <AnimatePresence>
        {showReactionPicker && (
          <ReactionPicker 
            messageId={message.id} 
            onClose={() => setShowReactionPicker(false)}
            isSender={isSender}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

