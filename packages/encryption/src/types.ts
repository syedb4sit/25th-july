// ============================================
// Shared Encryption Types
// ============================================

/** A complete encrypted message payload ready for transport */
export interface EncryptedPayload {
  ciphertext: string;           // Base64-encoded AES-256-GCM ciphertext
  iv: string;                   // Base64-encoded initialization vector (12 bytes)
  encryptedKeySender: string;   // Message key encrypted with sender's public key
  encryptedKeyRecipient: string; // Message key encrypted with recipient's public key
  signature: string;            // Base64-encoded Ed25519 signature of plaintext
}

/** A complete encrypted file payload */
export interface EncryptedFilePayload {
  encryptedBlob: ArrayBuffer;   // Encrypted file data
  iv: string;                   // Base64-encoded IV
  encryptedKeySender: string;
  encryptedKeyRecipient: string;
}

/** Key pair for ECDH key exchange (X25519) */
export interface ECDHKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

/** Key pair for message signing (Ed25519) */
export interface SigningKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

/** Exported public keys for server storage */
export interface ExportedPublicKeys {
  ecdhPublicKey: string;        // Base64-encoded X25519 public key
  signingPublicKey: string;     // Base64-encoded Ed25519 public key
}

/** Wrapped private key for IndexedDB storage */
export interface WrappedKeyData {
  wrappedECDHPrivateKey: string;    // Base64-encoded wrapped key
  wrappedSigningPrivateKey: string; // Base64-encoded wrapped key
  salt: string;                     // Base64-encoded PBKDF2 salt
  iv: string;                      // Base64-encoded IV used for wrapping
}

/** Key derivation parameters */
export interface KeyDerivationParams {
  iterations: number;           // 600,000 for PBKDF2
  hash: string;                 // SHA-256
  salt: Uint8Array;
}

export const CRYPTO_CONSTANTS = {
  PBKDF2_ITERATIONS: 600_000,
  PBKDF2_HASH: 'SHA-256',
  AES_KEY_LENGTH: 256,
  AES_IV_LENGTH: 12,            // 96 bits for GCM
  SALT_LENGTH: 32,              // 256 bits
  ECDH_CURVE: 'X25519',
  SIGNING_ALGORITHM: 'Ed25519',
} as const;
