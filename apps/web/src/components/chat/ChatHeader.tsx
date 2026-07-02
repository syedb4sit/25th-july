import React from 'react';
import { Avatar } from '../ui/Avatar';
import { Search, Pin, Menu } from 'lucide-react';
import { useUIStore } from '@/stores/ui.store';
import { usePresence } from '@/hooks/usePresence';


export function ChatHeader() {
  const { toggleSidebar, activeView, setActiveView } = useUIStore();
  const { partnerPresence, formatLastSeen } = usePresence();
  const { online: isPartnerOnline } = partnerPresence;

  return (
    <header className="h-16 border-b border-haven-border bg-haven-surface flex items-center justify-between px-4 z-10">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="md:hidden p-2 -ml-2 rounded-full text-haven-text-secondary hover:bg-haven-border hover:text-haven-text transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Avatar initials="P" size="md" isOnline={isPartnerOnline} />
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold text-haven-text">Partner</h2>
          <span className="text-xs text-haven-text-secondary">
            {formatLastSeen()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button 
          className="p-2 rounded-full text-haven-text-secondary hover:bg-haven-border hover:text-haven-text transition-colors"
          title="Search in conversation"
        >
          <Search className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setActiveView('pinned')}
          className={`p-2 rounded-full transition-colors ${activeView === 'pinned' ? 'bg-haven-accent/10 text-haven-accent' : 'text-haven-text-secondary hover:bg-haven-border hover:text-haven-text'}`}
          title="Pinned messages"
        >
          <Pin className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
