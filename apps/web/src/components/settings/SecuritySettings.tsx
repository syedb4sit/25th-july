'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Fingerprint, Key, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api';

export function SecuritySettings() {
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPasskeys();
  }, []);

  const fetchPasskeys = async () => {
    try {
      const data = await api.get<any[]>('/passkeys');
      setPasskeys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const removePasskey = async (id: string) => {
    if (confirm('Are you sure you want to remove this passkey?')) {
      await api.delete(`/passkeys/${id}`);
      fetchPasskeys();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-haven-text mb-1">Security & Keys</h3>
        <p className="text-sm text-haven-text-secondary">Manage your password and passkeys.</p>
      </div>

      {/* Password Section */}
      <div className="p-6 bg-haven-surface border border-haven-border rounded-2xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Key className="w-5 h-5 text-haven-accent" />
          <h4 className="text-sm font-bold text-haven-text">Change Password</h4>
        </div>
        <Input type="password" label="Current Password" />
        <Input type="password" label="New Password" />
        <Input type="password" label="Confirm New Password" />
        <Button className="mt-2">Update Password</Button>
      </div>

      {/* Passkeys Section */}
      <div className="p-6 bg-haven-surface border border-haven-border rounded-2xl space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Fingerprint className="w-5 h-5 text-haven-success" />
            <h4 className="text-sm font-bold text-haven-text">Passkeys</h4>
          </div>
          <Button variant="secondary" size="sm">Register New Passkey</Button>
        </div>
        <p className="text-xs text-haven-text-secondary mb-4">
          Passkeys allow you to sign in securely using your device's biometrics (Touch ID, Face ID) or screen lock.
        </p>

        {isLoading ? (
          <p className="text-sm text-haven-text-secondary">Loading...</p>
        ) : passkeys.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-haven-border rounded-xl">
            <p className="text-sm text-haven-text-secondary">No passkeys registered.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {passkeys.map(pk => (
              <div key={pk.id} className="flex items-center justify-between p-3 border border-haven-border rounded-xl bg-haven-bg">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-4 h-4 text-haven-text-secondary" />
                  <span className="text-sm font-medium text-haven-text">Passkey (Added {new Date(pk.createdAt).toLocaleDateString()})</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removePasskey(pk.id)} className="text-haven-destructive">
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keys Info */}
      <div className="p-4 rounded-xl bg-haven-accent/10 border border-haven-accent/20 flex gap-3">
        <ShieldAlert className="w-5 h-5 text-haven-accent flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-haven-text mb-1">End-to-End Encryption</h4>
          <p className="text-xs text-haven-text-secondary leading-relaxed">
            Your private keys are securely wrapped and stored in this browser's IndexedDB. If you forget your password and lose all trusted devices, your chat history cannot be recovered.
          </p>
        </div>
      </div>
    </div>
  );
}

