'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function MessageInput({ onSendMessage }: { onSendMessage?: (text: string) => void }) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    if (onSendMessage) {
      onSendMessage(text.trim());
    }
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="p-4 bg-haven-surface border-t border-haven-border relative z-10">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        
        {/* Attach Button */}
        <button className="p-2.5 rounded-full text-haven-text-secondary hover:bg-haven-border hover:text-haven-text transition-colors flex-shrink-0">
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Input Area */}
        <div className="flex-1 bg-haven-bg border border-haven-border rounded-2xl flex items-center px-4 py-1 min-h-[44px] focus-within:ring-1 focus-within:ring-haven-accent focus-within:border-haven-accent transition-all">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Type a secure message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-haven-text placeholder-haven-text-secondary resize-none py-2.5 custom-scrollbar max-h-[120px]"
            rows={1}
          />
        </div>

        {/* Send / Voice Button */}
        <AnimatePresence mode="wait">
          {text.trim().length > 0 ? (
            <motion.button
              key="send"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={handleSend}
              className="p-2.5 rounded-full bg-haven-accent text-white hover:bg-haven-accent/90 transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </motion.button>
          ) : (
            <motion.button
              key="mic"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="p-2.5 rounded-full text-haven-text-secondary hover:bg-haven-border hover:text-haven-text transition-colors flex-shrink-0"
            >
              <Mic className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

