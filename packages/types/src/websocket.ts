// ============================================
// Shared Types — WebSocket Events
// ============================================

// ── Client → Server Events ──────────────────
export interface ClientToServerEvents {
  'message:send': (payload: import('./message').SendMessagePayload) => void;
  'message:edit': (payload: import('./message').EditMessagePayload) => void;
  'message:react': (payload: { messageId: string; emoji: string }) => void;
  'message:pin': (payload: { messageId: string }) => void;
  'message:unpin': (payload: { messageId: string }) => void;
  'typing:start': () => void;
  'typing:stop': () => void;
  'status:delivered': (payload: { messageIds: string[] }) => void;
  'status:read': (payload: import('./message').ReadReceiptPayload) => void;
}

// ── Server → Client Events ──────────────────
export interface ServerToClientEvents {
  'message:new': (message: import('./message').EncryptedMessage) => void;
  'message:edited': (message: import('./message').EncryptedMessage) => void;
  'message:reaction': (payload: import('./message').MessageReaction) => void;
  'message:pinned': (payload: { messageId: string; pinnedBy: string }) => void;
  'message:unpinned': (payload: { messageId: string }) => void;
  'typing:start': (payload: { userId: string }) => void;
  'typing:stop': (payload: { userId: string }) => void;
  'status:delivered': (payload: { messageIds: string[]; deliveredAt: string }) => void;
  'status:read': (payload: { messageIds: string[]; readAt: string }) => void;
  'presence:update': (payload: { userId: string; online: boolean; lastSeen?: string }) => void;
  'session:terminated': (payload: { reason: string }) => void;
}

// ── Presence ─────────────────────────────────
export interface PresenceState {
  userId: string;
  online: boolean;
  lastSeen: string | null;
}
