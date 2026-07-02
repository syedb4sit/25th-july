'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { WebSocketClient } from '@/lib/websocket/client';
import { useAuthStore } from '@/stores/auth.store';
import { useMessageStore } from '@/stores/message.store';

// ── Local types ──────────────────────────────────────────────────────────────

type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface PresencePayload {
  userId: string;
  online: boolean;
  lastSeen: string | null;
}

interface TypingPayload {
  userId: string;
}

interface DeliveredPayload {
  messageIds: string[];
  timestamp: string;
}

interface ReadPayload {
  messageIds: string[];
  timestamp: string;
}

interface ReactionPayload {
  messageId: string;
  reaction: {
    id: string;
    messageId: string;
    userId: string;
    emoji: string;
    createdAt: string;
  };
}

interface PinPayload {
  messageId: string;
}

interface MessagePayload {
  id: string;
  senderId: string;
  content: string;
  replyToId: string | null;
  replyToContent?: string | null;
  edited: boolean;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  reactions: ReactionPayload['reaction'][];
  media: Array<{
    id: string;
    messageId: string;
    encryptedBlobUrl: string;
    encryptedKeySender: string;
    encryptedKeyRecipient: string;
    iv: string;
    type: 'IMAGE' | 'VIDEO' | 'VOICE' | 'DOCUMENT';
    mimeType: string;
    sizeBytes: number;
    originalName: string | null;
    uploadedAt: string;
    expiresAt: string;
    expired: boolean;
  }>;
  isPinned: boolean;
}

interface EditedPayload {
  id: string;
  content: string;
  edited: boolean;
}

// ── Module-level singleton ───────────────────────────────────────────────────

let wsClient: WebSocketClient | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function deriveWsUrl(): string {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'];

  if (apiUrl) {
    const url = new URL(apiUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws`;
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  return 'ws://localhost:3001/ws';
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface TypingState {
  [userId: string]: boolean;
}

interface PresenceState {
  [userId: string]: { online: boolean; lastSeen: string | null };
}

export interface UseWebSocketReturn {
  connectionState: ConnectionState;
  sendEvent: (event: string, payload: unknown) => void;
  typingUsers: TypingState;
  presenceMap: PresenceState;
}

export function useWebSocket(): UseWebSocketReturn {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  const addMessage = useMessageStore((s) => s.addMessage);
  const updateMessage = useMessageStore((s) => s.updateMessage);
  const addReaction = useMessageStore((s) => s.addReaction);
  const togglePin = useMessageStore((s) => s.togglePin);
  const setDelivered = useMessageStore((s) => s.setDelivered);
  const setRead = useMessageStore((s) => s.setRead);

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [typingUsers, setTypingUsers] = useState<TypingState>({});

  const presenceRef = useRef<PresenceState>({});
  const [presenceMap, setPresenceMap] = useState<PresenceState>({});

  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (wsClient) {
        wsClient.disconnect();
        wsClient = null;
      }
      setConnectionState('disconnected');
      return;
    }

    if (wsClient) return;

    const wsUrl = deriveWsUrl();
    wsClient = new WebSocketClient();

    wsClient.on('connection:state', (state: ConnectionState) => {
      setConnectionState(state);
    });

    wsClient.on('message:new', (payload: MessagePayload) => {
      addMessage(payload);
    });

    wsClient.on('message:edited', (payload: EditedPayload) => {
      updateMessage(payload.id, {
        content: payload.content,
        edited: payload.edited,
      });
    });

    wsClient.on('message:reaction', (payload: ReactionPayload) => {
      addReaction(payload.messageId, payload.reaction);
    });

    wsClient.on('message:pinned', (payload: PinPayload) => {
      togglePin(payload.messageId);
    });

    wsClient.on('message:unpinned', (payload: PinPayload) => {
      togglePin(payload.messageId);
    });

    wsClient.on('typing:start', (payload: TypingPayload) => {
      setTypingUsers((prev) => ({ ...prev, [payload.userId]: true }));

      const existing = typingTimeoutsRef.current.get(payload.userId);
      if (existing) clearTimeout(existing);

      const timeout = setTimeout(() => {
        setTypingUsers((prev) => ({ ...prev, [payload.userId]: false }));
        typingTimeoutsRef.current.delete(payload.userId);
      }, 5000);
      typingTimeoutsRef.current.set(payload.userId, timeout);
    });

    wsClient.on('typing:stop', (payload: TypingPayload) => {
      setTypingUsers((prev) => ({ ...prev, [payload.userId]: false }));
      const existing = typingTimeoutsRef.current.get(payload.userId);
      if (existing) {
        clearTimeout(existing);
        typingTimeoutsRef.current.delete(payload.userId);
      }
    });

    wsClient.on('status:delivered', (payload: DeliveredPayload) => {
      setDelivered(payload.messageIds, payload.timestamp);
    });

    wsClient.on('status:read', (payload: ReadPayload) => {
      setRead(payload.messageIds, payload.timestamp);
    });

    wsClient.on('presence:update', (payload: PresencePayload) => {
      presenceRef.current = {
        ...presenceRef.current,
        [payload.userId]: {
          online: payload.online,
          lastSeen: payload.lastSeen,
        },
      };
      setPresenceMap({ ...presenceRef.current });
    });

    wsClient.on('session:terminated', () => {
      logout();
    });

    wsClient.connect(wsUrl, accessToken);

    return () => {
      if (wsClient) {
        wsClient.disconnect();
        wsClient = null;
      }
      typingTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      typingTimeoutsRef.current.clear();
      setConnectionState('disconnected');
    };
  }, [
    isAuthenticated,
    accessToken,
    addMessage,
    updateMessage,
    addReaction,
    togglePin,
    setDelivered,
    setRead,
    logout,
  ]);

  const sendEvent = useCallback((event: string, payload: unknown) => {
    wsClient?.send(event, payload);
  }, []);

  return { connectionState, sendEvent, typingUsers, presenceMap };
}
