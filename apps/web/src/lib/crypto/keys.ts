// Web Crypto API key management using ECDH P-256 and ECDSA P-256

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function generateECDHKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveKey', 'deriveBits']
  );
}

export async function generateSigningKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key);
  return arrayBufferToBase64(exported);
}

export async function importECDHPublicKey(base64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64);
  return crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    []
  );
}

export async function importSigningPublicKey(base64: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(base64);
  return crypto.subtle.importKey(
    'spki',
    keyData,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify']
  );
}

export async function deriveWrappingKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 600000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey']
  );
}

export async function wrapPrivateKey(
  privateKey: CryptoKey,
  wrappingKey: CryptoKey
): Promise<{ wrapped: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const wrappedBuffer = await crypto.subtle.wrapKey(
    'pkcs8',
    privateKey,
    wrappingKey,
    { name: 'AES-GCM', iv }
  );

  return {
    wrapped: arrayBufferToBase64(wrappedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

export async function unwrapPrivateKey(
  wrappedB64: string,
  wrappingKey: CryptoKey,
  ivB64: string,
  type: 'ecdh' | 'signing'
): Promise<CryptoKey> {
  const wrappedData = base64ToArrayBuffer(wrappedB64);
  const iv = base64ToArrayBuffer(ivB64);

  const algorithm: EcKeyImportParams =
    type === 'ecdh'
      ? { name: 'ECDH', namedCurve: 'P-256' }
      : { name: 'ECDSA', namedCurve: 'P-256' };

  const usages: KeyUsage[] =
    type === 'ecdh' ? ['deriveKey', 'deriveBits'] : ['sign'];

  return crypto.subtle.unwrapKey(
    'pkcs8',
    wrappedData,
    wrappingKey,
    { name: 'AES-GCM', iv },
    algorithm,
    true,
    usages
  );
}
