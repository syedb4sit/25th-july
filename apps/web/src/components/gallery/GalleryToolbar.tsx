import React from 'react';
import { Button } from '../ui/Button';
import { Download, CheckSquare, Square } from 'lucide-react';
import { MediaType } from '@25th-july/types';
import { motion } from 'framer-motion';

interface GalleryToolbarProps {
  currentFilter: MediaType | 'ALL';
  onFilterChange: (filter: MediaType | 'ALL') => void;
  isSelectMode: boolean;
  onToggleSelectMode: () => void;
  selectedCount: number;
}

export function GalleryToolbar({
  currentFilter,
  onFilterChange,
  isSelectMode,
  onToggleSelectMode,
  selectedCount,
}: GalleryToolbarProps) {
  const tabs: { id: MediaType | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'All' },
    { id: 'IMAGE', label: 'Images' },
    { id: 'VIDEO', label: 'Videos' },
    { id: 'VOICE', label: 'Voice Notes' },
    { id: 'DOCUMENT', label: 'Documents' },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-haven-bg p-1 rounded-xl border border-haven-border overflow-x-auto custom-scrollbar">
        {tabs.map((tab) => {
          const isActive = currentFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                isActive ? 'text-white' : 'text-haven-text-secondary hover:text-haven-text'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="gallery-tab"
                  className="absolute inset-0 bg-haven-accent rounded-lg"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button 
          variant={isSelectMode ? 'primary' : 'secondary'} 
          onClick={onToggleSelectMode}
        >
          {isSelectMode ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
          {isSelectMode ? 'Cancel Selection' : 'Select'}
        </Button>

        {isSelectMode ? (
          <Button 
            disabled={selectedCount === 0}
            className="whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Selected ({selectedCount})
          </Button>
        ) : (
          <Button className="whitespace-nowrap">
            <Download className="w-4 h-4 mr-2" />
            Download All
          </Button>
        )}
      </div>
    </div>
  );
}
