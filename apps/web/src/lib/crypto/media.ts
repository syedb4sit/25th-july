// Media file encryption and decryption

import { arrayBufferToBase64, base64ToArrayBuffer } from './keys';

export interface EncryptedFilePayload {
  encryptedData: ArrayBuffer;
  iv: string;
  encryptedKeyRecipient: string;
  encryptedKeySender: string;
  ivKeyRecipient: string;
  ivKeySender: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

async function deriveFileSharedKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey
): Promise<CryptoKey> {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: publicKey },
    privateKey,
    256
  );

  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    sharedBits,
    'HKDF',
    false,
    ['deriveKey']
  );

  const encoder = new TextEncoder();
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: encoder.encode('file-key'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );
}

export async function encryptFile(
  file: File,
  senderPrivateKey: CryptoKey,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey,
  onProgress?: (p: number) => void
): Promise<EncryptedFilePayload> {
  // Read the file
  onProgress?.(0);
  const fileBuffer = await file.arrayBuffer();
  onProgress?.(0.2);

  // Generate a random AES-GCM 256 key for this file
  const fileKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Encrypt the file data
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    fileKey,
    fileBuffer
  );
  onProgress?.(0.6);

  // Export the raw AES key
  const rawFileKey = await crypto.subtle.exportKey('raw', fileKey);

  // Encrypt the AES key for the recipient
  const recipientSharedKey = await deriveFileSharedKey(senderPrivateKey, recipientPublicKey);
  const recipientKeyIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyForRecipient = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: recipientKeyIv },
    recipientSharedKey,
    rawFileKey
  );
  onProgress?.(0.8);

  // Encrypt the AES key for the sender
  const senderSharedKey = await deriveFileSharedKey(senderPrivateKey, senderPublicKey);
  const senderKeyIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyForSender = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: senderKeyIv },
    senderSharedKey,
    rawFileKey
  );
  onProgress?.(1);

  return {
    encryptedData,
    iv: arrayBufferToBase64(iv.buffer),
    encryptedKeyRecipient: arrayBufferToBase64(encryptedKeyForRecipient),
    encryptedKeySender: arrayBufferToBase64(encryptedKeyForSender),
    ivKeyRecipient: arrayBufferToBase64(recipientKeyIv.buffer),
    ivKeySender: arrayBufferToBase64(senderKeyIv.buffer),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  };
}

export async function decryptFile(
  encryptedData: ArrayBuffer,
  ivB64: string,
  encryptedKeyB64: string,
  privateKey: CryptoKey,
  senderPublicKey: CryptoKey
): Promise<ArrayBuffer> {
  // Derive the shared key
  const sharedKey = await deriveFileSharedKey(privateKey, senderPublicKey);

  // Decrypt the AES file key
  const encryptedKeyData = base64ToArrayBuffer(encryptedKeyB64);
  const rawFileKey = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(base64ToArrayBuffer(ivB64)) },
    sharedKey,
    encryptedKeyData
  );

  // Import the decrypted AES key
  const fileKey = await crypto.subtle.importKey(
    'raw',
    rawFileKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt the file data
  const iv = base64ToArrayBuffer(ivB64);
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    fileKey,
    encryptedData
  );
}
