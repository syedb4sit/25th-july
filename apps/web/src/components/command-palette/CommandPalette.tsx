'use client';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/ui.store';
import { Search, MessageSquare, Image as ImageIcon, Video, Mic, FileText, X } from 'lucide-react';
import { Input } from '../ui/Input';

export function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette } = useUIStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'MESSAGES' | 'IMAGES' | 'VIDEOS' | 'VOICE' | 'DOCUMENTS'>('ALL');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().openCommandPalette();
      }
      if (e.key === 'Escape') {
        closeCommandPalette();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeCommandPalette]);

  if (!isCommandPaletteOpen) return null;

  type Filter = { id: 'ALL' | 'MESSAGES' | 'IMAGES' | 'VIDEOS' | 'VOICE' | 'DOCUMENTS'; label: string; icon?: React.ElementType };
  const filters: Filter[] = [
    { id: 'ALL', label: 'All' },
    { id: 'MESSAGES', label: 'Messages', icon: MessageSquare },
    { id: 'IMAGES', label: 'Images', icon: ImageIcon },
    { id: 'VIDEOS', label: 'Videos', icon: Video },
    { id: 'VOICE', label: 'Voice Notes', icon: Mic },
    { id: 'DOCUMENTS', label: 'Documents', icon: FileText },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 sm:pt-32 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeCommandPalette}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
          className="relative w-full max-w-2xl bg-haven-surface border border-haven-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-haven-border flex items-center gap-3">
            <Search className="w-5 h-5 text-haven-text-secondary flex-shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages, files, and more..."
              className="flex-1 bg-transparent border-none text-haven-text placeholder:text-haven-text-secondary focus:outline-none text-lg"
            />
            <button 
              onClick={closeCommandPalette}
              className="p-1 rounded-md text-haven-text-secondary hover:bg-haven-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 p-3 overflow-x-auto custom-scrollbar border-b border-haven-border bg-haven-bg/50">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === f.id 
                    ? 'bg-haven-accent text-white' 
                    : 'bg-haven-surface border border-haven-border text-haven-text-secondary hover:text-haven-text'
                }`}
              >
                {f.icon && <f.icon className="w-3.5 h-3.5" />}
                {f.label}
              </button>
            ))}
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
            {query.length > 0 ? (
              <div className="py-8 text-center text-haven-text-secondary">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                <p>Searching through end-to-end encrypted data...</p>
                <p className="text-xs opacity-70 mt-1">This happens locally on your device.</p>
              </div>
            ) : (
              <div className="py-12 text-center text-haven-text-secondary">
                <p>Type to start searching your private space.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

