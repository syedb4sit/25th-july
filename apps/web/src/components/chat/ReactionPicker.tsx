import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

interface ReactionPickerProps {
  messageId: string;
  onClose: () => void;
  isSender: boolean;
}

export function ReactionPicker({ messageId, onClose, isSender }: ReactionPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSelect = (emoji: string) => {
    // Call store or API to add reaction
    console.log('Reacted with', emoji, 'to message', messageId);
    onClose();
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9, y: isSender ? -10 : 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className={`absolute z-20 flex items-center gap-1 bg-haven-surface border border-haven-border shadow-xl rounded-full px-2 py-1.5 ${
        isSender ? 'bottom-[calc(100%+8px)] right-0' : 'top-[calc(100%+8px)] left-0'
      }`}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleSelect(emoji)}
          className="text-lg hover:bg-haven-border hover:scale-110 transition-all rounded-full w-8 h-8 flex items-center justify-center"
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  );
}
