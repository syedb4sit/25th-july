import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '../ui/Button';
import { Activity, Globe, MonitorSmartphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function SessionManager() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await api.get<any[]>('/sessions');
      setSessions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const terminateSession = async (id: string) => {
    await api.delete(`/sessions/${id}`);
    fetchSessions();
  };

  const terminateAll = async () => {
    if (confirm('Log out all sessions? You will remain logged in on this device.')) {
      await api.delete(`/sessions`);
      fetchSessions();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-haven-text mb-1">Active Sessions</h3>
          <p className="text-sm text-haven-text-secondary">Currently logged-in browsers and apps.</p>
        </div>
        {sessions.length > 1 && (
          <Button variant="secondary" onClick={terminateAll}>Terminate All Other Sessions</Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-haven-text-secondary">Loading sessions...</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session, i) => (
            <div key={session.id} className="p-4 border border-haven-border bg-haven-surface rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-haven-bg rounded-full border border-haven-border">
                  <MonitorSmartphone className="w-5 h-5 text-haven-text-secondary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-haven-text flex items-center gap-2">
                    {session.device?.name || 'Unknown Device'}
                    {i === 0 && (
                      <span className="bg-haven-success/10 text-haven-success text-[10px] px-2 py-0.5 rounded-full font-bold">
                        CURRENT
                      </span>
                    )}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-haven-text-secondary">
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {session.ipMasked || 'Unknown IP'}</span>
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Last active {formatDistanceToNow(new Date(session.lastUsedAt))} ago</span>
                  </div>
                </div>
              </div>
              
              {i !== 0 && (
                <Button variant="ghost" size="sm" onClick={() => terminateSession(session.id)} className="text-haven-text-secondary hover:text-haven-text">
                  Log out
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
