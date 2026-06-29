// ============================================
// Shared Types — Device
// ============================================

export interface Device {
  id: string;
  userId: string;
  name: string;
  fingerprintHash: string;
  browser: string | null;
  os: string | null;
  trusted: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export interface DeviceRegistrationPayload {
  fingerprintHash: string;
  browser: string;
  os: string;
}
