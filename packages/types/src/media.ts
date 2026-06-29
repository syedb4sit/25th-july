// ============================================
// Shared Types — Media
// ============================================

export type MediaType = 'IMAGE' | 'VIDEO' | 'VOICE' | 'DOCUMENT';

export interface MediaInfo {
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

export interface MediaUploadPayload {
  messageId: string;
  encryptedKeySender: string;
  encryptedKeyRecipient: string;
  iv: string;
  type: MediaType;
  mimeType: string;
  originalName: string;
}

export interface GalleryFilters {
  type?: MediaType;
  page?: number;
  limit?: number;
}

export interface GalleryResponse {
  items: MediaInfo[];
  total: number;
  page: number;
  totalPages: number;
}
