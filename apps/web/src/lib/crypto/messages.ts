// Message encryption and decryption with ECDH + AES-GCM + ECDSA

import { arrayBufferToBase64, base64ToArrayBuffer } from './keys';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  encryptedKeyRecipient: string;
  encryptedKeySender: string;
  ivKeyRecipient: string;
  ivKeySender: string;
  signature: string;
  senderPublicKey: string;
}

export async function deriveSharedKey(
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
      info: encoder.encode('message-key'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey']
  );
}

export async function encryptMessage(
  plaintext: string,
  senderPrivateKey: CryptoKey,
  recipientPublicKey: CryptoKey,
  senderPublicKey: CryptoKey,
  signingPrivateKey: CryptoKey
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();

  // Generate random AES-GCM 256 key for this message
  const messageKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Encrypt plaintext with the message key
  const messageIv = crypto.getRandomValues(new Uint8Array(12));
  const plaintextBytes = encoder.encode(plaintext);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: messageIv },
    messageKey,
    plaintextBytes
  );

  // Export the raw AES key
  const rawMessageKey = await crypto.subtle.exportKey('raw', messageKey);

  // Encrypt the AES key for the recipient
  const recipientSharedKey = await deriveSharedKey(senderPrivateKey, recipientPublicKey);
  const recipientKeyIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyForRecipient = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: recipientKeyIv },
    recipientSharedKey,
    rawMessageKey
  );

  // Encrypt the AES key for the sender (so sender can read their own messages)
  const senderSharedKey = await deriveSharedKey(senderPrivateKey, senderPublicKey);
  const senderKeyIv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedKeyForSender = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: senderKeyIv },
    senderSharedKey,
    rawMessageKey
  );

  // Sign the plaintext
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingPrivateKey,
    plaintextBytes
  );

  // Export sender public key
  const senderPubKeyExported = await crypto.subtle.exportKey('spki', senderPublicKey);

  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(messageIv.buffer),
    encryptedKeyRecipient: arrayBufferToBase64(encryptedKeyForRecipient),
    encryptedKeySender: arrayBufferToBase64(encryptedKeyForSender),
    ivKeyRecipient: arrayBufferToBase64(recipientKeyIv.buffer),
    ivKeySender: arrayBufferToBase64(senderKeyIv.buffer),
    signature: arrayBufferToBase64(signature),
    senderPublicKey: arrayBufferToBase64(senderPubKeyExported),
  };
}

export async function decryptMessage(
  payload: EncryptedPayload,
  privateKey: CryptoKey,
  senderPublicKey: CryptoKey,
  signingPublicKey: CryptoKey,
  isSender: boolean
): Promise<string> {
  // Derive the shared key
  const sharedKey = await deriveSharedKey(privateKey, senderPublicKey);

  // Pick the correct encrypted key and IV based on whether we're the sender
  const encryptedKeyB64 = isSender
    ? payload.encryptedKeySender
    : payload.encryptedKeyRecipient;
  const keyIvB64 = isSender ? payload.ivKeySender : payload.ivKeyRecipient;

  // Decrypt the AES message key
  const encryptedKeyData = base64ToArrayBuffer(encryptedKeyB64);
  const keyIv = base64ToArrayBuffer(keyIvB64);
  const rawMessageKey = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(keyIv) },
    sharedKey,
    encryptedKeyData
  );

  // Import the decrypted AES key
  const messageKey = await crypto.subtle.importKey(
    'raw',
    rawMessageKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  // Decrypt the ciphertext
  const ciphertextData = base64ToArrayBuffer(payload.ciphertext);
  const messageIv = base64ToArrayBuffer(payload.iv);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(messageIv) },
    messageKey,
    ciphertextData
  );

  const decoder = new TextDecoder();
  const plaintext = decoder.decode(decryptedBuffer);

  // Verify the signature
  const encoder = new TextEncoder();
  const signatureData = base64ToArrayBuffer(payload.signature);
  const isValid = await crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    signingPublicKey,
    signatureData,
    encoder.encode(plaintext)
  );

  if (!isValid) {
    throw new Error('Message signature verification failed');
  }

  return plaintext;
}
