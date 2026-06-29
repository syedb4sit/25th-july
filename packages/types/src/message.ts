// ============================================
// Shared Types — Message
// ============================================

export interface EncryptedMessage {
  id: string;
  senderId: string;
  encryptedContent: string;     // AES-256-GCM ciphertext (Base64)
  encryptedKeySender: string;   // Message key encrypted with sender's public key
  encryptedKeyRecipient: string; // Message key encrypted with recipient's public key
  iv: string;                   // Initialization vector (Base64)
  signature: string;            // Ed25519 signature (Base64)
  replyToId: string | null;
  edited: boolean;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  // Populated relations
  reactions?: MessageReaction[];
  media?: MediaInfo[];
  replyTo?: EncryptedMessage | null;
  isPinned?: boolean;
}

export interface DecryptedMessage {
  id: string;
  senderId: string;
  content: string;              // Decrypted plaintext
  replyToId: string | null;
  replyToContent?: string | null; // Decrypted reply preview
  edited: boolean;
  createdAt: string;
  deliveredAt: string | null;
  readAt: string | null;
  reactions: MessageReaction[];
  media: MediaInfo[];
  isPinned: boolean;
}

export interface SendMessagePayload {
  encryptedContent: string;
  encryptedKeySender: string;
  encryptedKeyRecipient: string;
  iv: string;
  signature: string;
  replyToId?: string;
}

export interface EditMessagePayload {
  messageId: string;
  encryptedContent: string;
  encryptedKeySender: string;
  encryptedKeyRecipient: string;
  iv: string;
  signature: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface ReadReceiptPayload {
  messageIds: string[];
}
