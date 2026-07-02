'use client';
import React from 'react';
import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-1 bg-haven-surface border border-haven-border px-3 py-2 rounded-2xl rounded-bl-sm w-fit"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
        className="w-1.5 h-1.5 bg-haven-text-secondary rounded-full"
      />
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
        className="w-1.5 h-1.5 bg-haven-text-secondary rounded-full"
      />
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
        className="w-1.5 h-1.5 bg-haven-text-secondary rounded-full"
      />
    </motion.div>
  );
}

