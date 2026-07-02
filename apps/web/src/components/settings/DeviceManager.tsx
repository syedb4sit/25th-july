import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '../ui/Button';
import { Smartphone, Monitor, ShieldCheck, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DeviceManager() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const data = await api.get<any[]>('/devices');
      setDevices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const revokeDevice = async (id: string) => {
    if (confirm('Are you sure? This device will be logged out and untrusted.')) {
      await api.delete(`/devices/${id}`);
      fetchDevices();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-haven-text mb-1">Trusted Devices</h3>
        <p className="text-sm text-haven-text-secondary">Devices that have been approved to decrypt your messages.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-haven-text-secondary">Loading devices...</p>
      ) : devices.length === 0 ? (
        <p className="text-sm text-haven-text-secondary">No devices found.</p>
      ) : (
        <div className="space-y-3">
          {devices.map(device => (
            <div key={device.id} className="p-4 border border-haven-border bg-haven-surface rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-haven-bg rounded-full">
                  {device.os?.toLowerCase().includes('ios') || device.os?.toLowerCase().includes('android') ? (
                    <Smartphone className="w-5 h-5 text-haven-accent" />
                  ) : (
                    <Monitor className="w-5 h-5 text-haven-accent" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-haven-text flex items-center gap-2">
                    {device.name}
                    {device.trusted && <span title="Trusted"><ShieldCheck className="w-3.5 h-3.5 text-haven-success" /></span>}
                    {!device.trusted && <span title="Awaiting Approval"><AlertCircle className="w-3.5 h-3.5 text-yellow-500" /></span>}
                  </h4>
                  <p className="text-xs text-haven-text-secondary mt-1">
                    Added {formatDistanceToNow(new Date(device.createdAt))} ago
                  </p>
                </div>
              </div>
              
              <Button variant="destructive" size="sm" onClick={() => revokeDevice(device.id)}>
                Revoke
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
