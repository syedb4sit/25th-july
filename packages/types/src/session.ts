// ============================================
// Shared Types — Session
// ============================================

export interface Session {
  id: string;
  userId: string;
  deviceId: string | null;
  deviceName: string | null;
  browser: string | null;
  os: string | null;
  ipMasked: string | null;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}
