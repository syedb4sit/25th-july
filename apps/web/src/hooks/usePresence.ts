'use client';

import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

// ── Local types ──────────────────────────────────────────────────────────────

interface PartnerPresence {
  online: boolean;
  lastSeen: string | null;
}

interface UsePresenceReturn {
  partnerPresence: PartnerPresence;
  isPartnerTyping: boolean;
  setPartnerPresence: (online: boolean, lastSeen: string | null) => void;
  setPartnerTyping: (typing: boolean) => void;
  formatLastSeen: () => string;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePresence(): UsePresenceReturn {
  const [partnerPresence, setPartnerPresenceState] = useState<PartnerPresence>({
    online: false,
    lastSeen: null,
  });

  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const setPartnerPresence = useCallback(
    (online: boolean, lastSeen: string | null) => {
      setPartnerPresenceState({ online, lastSeen });
    },
    [],
  );

  const setPartnerTyping = useCallback((typing: boolean) => {
    setIsPartnerTyping(typing);
  }, []);

  const formatLastSeen = useCallback((): string => {
    if (partnerPresence.online) {
      return 'Online';
    }

    if (!partnerPresence.lastSeen) {
      return 'Offline';
    }

    try {
      const date = new Date(partnerPresence.lastSeen);
      const distance = formatDistanceToNow(date, { addSuffix: true });
      return `Last seen ${distance}`;
    } catch {
      return 'Offline';
    }
  }, [partnerPresence.online, partnerPresence.lastSeen]);

  return {
    partnerPresence,
    isPartnerTyping,
    setPartnerPresence,
    setPartnerTyping,
    formatLastSeen,
  };
}
