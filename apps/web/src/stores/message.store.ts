import { create } from 'zustand';
import { api } from '@/lib/api';

// ── Local types ──────────────────────────────────────────────────────────────

interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

type MediaType = 'IMAGE' | 'VIDEO' | 'VOICE' | 'DOCUMENT';

interface MediaInfo {
  id: string;
  messageId: string;
  encryptedBlobUrl: string;
  encryptedKeySender: string;
  encryptedKeyRecipient: string;
  iv: string;
  type: MediaType;
  mimeType: string;
  sizeBytes: number;
  originalName: string | null;
  uploadedAt: string;
  expiresAt: string;
  expired: boolean;
}

interface DecryptedMessage {
  id: string;
  senderId: string;
  content: string;
  replyToId: string | null;
  replyToContent?: string | null;
  edited: boolean;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  reactions: MessageReaction[];
  media: MediaInfo[];
  isPinned: boolean;
}

interface MessageState {
  messages: DecryptedMessage[];
  isLoading: boolean;
  hasMore: boolean;
  cursor: string | null;
  replyingTo: DecryptedMessage | null;
  loadMessages: (cursor?: string) => Promise<void>;
  addMessage: (msg: DecryptedMessage) => void;
  updateMessage: (id: string, updates: Partial<DecryptedMessage>) => void;
  setReplyingTo: (msg: DecryptedMessage | null) => void;
  setDelivered: (ids: string[], timestamp: string) => void;
  setRead: (ids: string[], timestamp: string) => void;
  addReaction: (messageId: string, reaction: MessageReaction) => void;
  togglePin: (messageId: string) => void;
}

interface MessagesResponse {
  messages: DecryptedMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  isLoading: false,
  hasMore: true,
  cursor: null,
  replyingTo: null,

  loadMessages: async (cursor?: string) => {
    const state = get();
    if (state.isLoading) return;

    set({ isLoading: true });

    try {
      const effectiveCursor = cursor ?? state.cursor;
      const params = new URLSearchParams({ limit: '50' });
      if (effectiveCursor) {
        params.set('cursor', effectiveCursor);
      }

      const data = await api.get<MessagesResponse>(
        `/api/messages?${params.toString()}`,
      );

      set({
        messages: [...data.messages, ...state.messages],
        cursor: data.nextCursor,
        hasMore: data.hasMore,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addMessage: (msg: DecryptedMessage) => {
    set((state) => {
      const exists = state.messages.some((m) => m.id === msg.id);
      if (exists) return state;
      return { messages: [...state.messages, msg] };
    });
  },

  updateMessage: (id: string, updates: Partial<DecryptedMessage>) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg,
      ),
    }));
  },

  setReplyingTo: (msg: DecryptedMessage | null) => {
    set({ replyingTo: msg });
  },

  setDelivered: (ids: string[], timestamp: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        ids.includes(msg.id) && !msg.deliveredAt
          ? { ...msg, deliveredAt: timestamp }
          : msg,
      ),
    }));
  },

  setRead: (ids: string[], timestamp: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        ids.includes(msg.id) && !msg.readAt
          ? { ...msg, readAt: timestamp }
          : msg,
      ),
    }));
  },

  addReaction: (messageId: string, reaction: MessageReaction) => {
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id !== messageId) return msg;
        const exists = msg.reactions.some((r) => r.id === reaction.id);
        if (exists) return msg;
        return { ...msg, reactions: [...msg.reactions, reaction] };
      }),
    }));
  },

  togglePin: (messageId: string) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg,
      ),
    }));
  },
}));
