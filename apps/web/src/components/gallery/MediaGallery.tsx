import React, { useState } from 'react';
import { useUIStore } from '@/stores/ui.store';
import { GalleryToolbar } from './GalleryToolbar';
import { GalleryGrid } from './GalleryGrid';
import { MediaType } from '@25th-july/types';

export function MediaGallery() {
  const [filter, setFilter] = useState<MediaType | 'ALL'>('ALL');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const { selectedMediaIds, clearMediaSelection } = useUIStore();

  const toggleSelectMode = () => {
    if (isSelectMode) {
      clearMediaSelection();
    }
    setIsSelectMode(!isSelectMode);
  };

  return (
    <div className="flex flex-col h-full bg-haven-bg w-full">
      <div className="p-6 border-b border-haven-border bg-haven-surface">
        <h1 className="text-2xl font-bold text-haven-text mb-1">Media Gallery</h1>
        <p className="text-sm text-haven-text-secondary">View and download all shared media, voice notes, and documents.</p>
        
        <div className="mt-6">
          <GalleryToolbar 
            currentFilter={filter}
            onFilterChange={setFilter}
            isSelectMode={isSelectMode}
            onToggleSelectMode={toggleSelectMode}
            selectedCount={selectedMediaIds.size}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <GalleryGrid filter={filter} isSelectMode={isSelectMode} />
      </div>
    </div>
  );
}
