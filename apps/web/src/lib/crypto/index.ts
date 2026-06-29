// Crypto module barrel exports
export {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  generateSalt,
  generateECDHKeyPair,
  generateSigningKeyPair,
  exportPublicKey,
  importECDHPublicKey,
  importSigningPublicKey,
  deriveWrappingKey,
  wrapPrivateKey,
  unwrapPrivateKey,
} from './keys';

export {
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
} from './messages';

export type { EncryptedPayload } from './messages';

export {
  encryptFile,
  decryptFile,
} from './media';

export type { EncryptedFilePayload } from './media';
