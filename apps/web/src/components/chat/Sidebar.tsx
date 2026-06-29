import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { Avatar } from '../ui/Avatar';
import { MessageSquare, Image as ImageIcon, Pin, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePresence } from '@/hooks/usePresence';
import { formatDistanceToNow } from 'date-fns';

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, toggleSidebar, activeView, setActiveView } = useUIStore();
  const { isPartnerOnline, lastSeen } = usePresence();

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'gallery', label: 'Media Gallery', icon: ImageIcon },
    { id: 'pinned', label: 'Pinned Messages', icon: Pin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 280 : 80 }}
      className="h-full flex flex-col bg-haven-surface border-r border-haven-border z-20 flex-shrink-0 transition-all duration-300 relative"
    >
      <div className="p-4 flex items-center gap-3">
        <Avatar src={user?.avatarUrl} initials={user?.displayName} size="md" isOnline={true} />
        {isSidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
            <p className="text-sm font-medium text-haven-text truncate">{user?.displayName}</p>
            <p className="text-xs text-haven-text-secondary truncate">My Account</p>
          </motion.div>
        )}
      </div>

      <div className="px-3 py-2">
        <div className="h-px w-full bg-haven-border" />
      </div>

      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group relative ${
                isActive ? 'bg-haven-accent/10 text-haven-accent' : 'text-haven-text-secondary hover:bg-haven-border/50 hover:text-haven-text'
              }`}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-haven-accent' : 'text-haven-text-secondary group-hover:text-haven-text'}`} />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="text-sm font-medium whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      <div className="p-4 flex flex-col gap-4">
        {isSidebarOpen && (
          <div className="flex items-center gap-3 p-3 bg-haven-bg rounded-xl border border-haven-border/50">
            <Avatar initials="P" size="sm" isOnline={isPartnerOnline} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-haven-text truncate">Partner</p>
              <p className="text-xs text-haven-text-secondary truncate">
                {isPartnerOnline ? 'Online' : lastSeen ? `Last seen ${formatDistanceToNow(new Date(lastSeen))} ago` : 'Offline'}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-haven-text-secondary hover:bg-haven-destructive/10 hover:text-haven-destructive transition-colors group"
          title={!isSidebarOpen ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isSidebarOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 bg-haven-surface border border-haven-border rounded-full flex items-center justify-center text-haven-text-secondary hover:text-haven-text hover:border-haven-accent transition-colors z-30 shadow-sm hidden md:flex"
      >
        {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
