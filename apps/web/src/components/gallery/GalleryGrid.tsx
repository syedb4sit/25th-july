import React from 'react';
import { GalleryItem } from './GalleryItem';
import { MediaType } from '@25th-july/types';

interface GalleryGridProps {
  filter: MediaType | 'ALL';
  isSelectMode: boolean;
}

export function GalleryGrid({ filter, isSelectMode }: GalleryGridProps) {
  // Stub data - would normally fetch from API using pagination
  const mockItems = [
    { id: '1', type: 'IMAGE', originalName: 'photo.jpg', uploadedAt: new Date().toISOString(), expired: false, sizeBytes: 1024 * 1024 * 2.5 },
    { id: '2', type: 'VIDEO', originalName: 'video.mp4', uploadedAt: new Date().toISOString(), expired: false, sizeBytes: 1024 * 1024 * 15 },
    { id: '3', type: 'VOICE', originalName: 'Voice Note', uploadedAt: new Date(Date.now() - 8*24*60*60*1000).toISOString(), expired: true, sizeBytes: 1024 * 500 },
    { id: '4', type: 'DOCUMENT', originalName: 'Contract.pdf', uploadedAt: new Date().toISOString(), expired: false, sizeBytes: 1024 * 1024 * 4 },
  ];

  const filtered = filter === 'ALL' ? mockItems : mockItems.filter(i => i.type === filter);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-haven-text-secondary">No media found.</p>
      </div>
    );
  }

  // Use a standard CSS Grid. We mix square items (images/videos) and list items (docs/voice)
  // For a clean look, we can render them all as cards, but docs/voice have different internal layouts.

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filtered.map((item) => (
        <GalleryItem 
          key={item.id} 
          item={item as any} 
          isSelectMode={isSelectMode} 
        />
      ))}
    </div>
  );
}
