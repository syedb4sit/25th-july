import React from 'react';
import { useUIStore } from '@/stores/ui.store';
import { Check, Download, Image as ImageIcon, Video, Mic, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface GalleryItemProps {
  item: any; // Using any for stub, normally MediaInfo
  isSelectMode: boolean;
}

export function GalleryItem({ item, isSelectMode }: GalleryItemProps) {
  const { selectedMediaIds, toggleMediaSelection } = useUIStore();
  const isSelected = selectedMediaIds.has(item.id);

  const getIcon = () => {
    switch (item.type) {
      case 'IMAGE': return <ImageIcon className="w-8 h-8 opacity-50" />;
      case 'VIDEO': return <Video className="w-8 h-8 opacity-50" />;
      case 'VOICE': return <Mic className="w-8 h-8 opacity-50" />;
      case 'DOCUMENT': return <FileText className="w-8 h-8 opacity-50" />;
      default: return <FileText className="w-8 h-8 opacity-50" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative group aspect-square rounded-2xl border flex flex-col overflow-hidden transition-all ${
        isSelected 
          ? 'border-haven-accent ring-2 ring-haven-accent ring-offset-2 ring-offset-haven-bg bg-haven-accent/5' 
          : 'border-haven-border bg-haven-surface hover:border-haven-text-secondary/50'
      }`}
      onClick={() => isSelectMode && toggleMediaSelection(item.id)}
    >
      {/* Thumbnail Area (Mocked for now without actual decryption logic in UI component) */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
        {getIcon()}
      </div>

      {/* Info Bar */}
      <div className="h-14 bg-haven-bg border-t border-haven-border px-3 py-2 flex flex-col justify-center z-10">
        <p className="text-xs font-medium text-haven-text truncate">{item.originalName}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[10px] text-haven-text-secondary">
            {format(new Date(item.uploadedAt), 'MMM d, yyyy')} • {formatSize(item.sizeBytes)}
          </p>
        </div>
      </div>

      {/* Hover Actions (Desktop) */}
      {!isSelectMode && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            className="p-2 rounded-full bg-haven-surface/80 backdrop-blur border border-haven-border text-haven-text hover:text-haven-accent shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              // Trigger download
            }}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Select Mode Checkbox */}
      {isSelectMode && (
        <div className="absolute top-2 left-2 z-10">
          <div className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
            isSelected 
              ? 'bg-haven-accent border-haven-accent text-white' 
              : 'bg-haven-surface border-haven-border text-transparent'
          }`}>
            <Check className="w-4 h-4" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
