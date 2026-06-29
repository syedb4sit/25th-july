import React, { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Camera } from 'lucide-react';
import { api } from '@/lib/api';

export function AccountSettings() {
  const { user, setUser } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const res = await api.put('/settings/profile', { displayName });
      setUser({ ...user!, displayName: res.displayName });
      setMessage('Profile updated successfully.');
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-haven-text mb-1">Account Settings</h3>
        <p className="text-sm text-haven-text-secondary">Manage your public profile information.</p>
      </div>

      <div className="flex items-center gap-6 p-6 bg-haven-surface border border-haven-border rounded-2xl">
        <div className="relative group cursor-pointer">
          <Avatar initials={user?.displayName} src={user?.avatarUrl} size="xl" />
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-haven-text mb-1">Profile Picture</h4>
          <p className="text-xs text-haven-text-secondary">Click the avatar to upload a new image. (Coming soon)</p>
        </div>
      </div>

      <div className="space-y-4">
        <Input 
          label="Display Name" 
          value={displayName} 
          onChange={(e) => setDisplayName(e.target.value)} 
        />
        
        <Input 
          label="Email Address" 
          value={user?.email} 
          disabled 
        />

        {message && (
          <p className={`text-sm ${message.includes('success') ? 'text-haven-success' : 'text-haven-destructive'}`}>
            {message}
          </p>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} isLoading={isLoading}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
