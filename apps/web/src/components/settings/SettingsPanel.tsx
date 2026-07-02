'use client';
import React, { useState } from 'react';
import { User, Shield, Smartphone, Activity, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Sub-panels
import { AccountSettings } from './AccountSettings';
import { SecuritySettings } from './SecuritySettings';
import { DeviceManager } from './DeviceManager';
import { SessionManager } from './SessionManager';

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'devices' | 'sessions' | 'notifications'>('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'security', label: 'Security & Keys', icon: Shield },
    { id: 'devices', label: 'Trusted Devices', icon: Smartphone },
    { id: 'sessions', label: 'Active Sessions', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="flex h-full w-full bg-haven-bg">
      {/* Settings Navigation */}
      <div className="w-64 border-r border-haven-border bg-haven-surface p-4 flex flex-col gap-2">
        <h2 className="text-lg font-bold text-haven-text mb-4 px-2">Settings</h2>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
              activeTab === tab.id
                ? 'bg-haven-accent/10 text-haven-accent'
                : 'text-haven-text-secondary hover:bg-haven-border hover:text-haven-text'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'account' && <AccountSettings />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'devices' && <DeviceManager />}
              {activeTab === 'sessions' && <SessionManager />}
              {activeTab === 'notifications' && (
                <div>
                  <h3 className="text-xl font-bold text-haven-text mb-6">Notifications</h3>
                  <p className="text-haven-text-secondary">Notification settings coming soon.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

