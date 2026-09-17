/**
 * Zero-Knowledge Client-Side Cryptography for File Attachments
 * Uses W3C WebCrypto API (AES-256-GCM) to encrypt files before upload
 * and decrypt files in-browser upon download.
 */

// Helper: Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper: Convert Base64 to Uint8Array
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface EncryptedFilePayload {
  encryptedBlob: Blob;
  fileKey: string; // Base64 AES-256-GCM symmetric key
  fileIv: string; // Base64 12-byte IV
  originalName: string;
  mimeType: string;
  size: number;
}

export interface FileAttachmentMetadata {
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  fileKey: string;
  fileIv: string;
  storage?: 'minio' | 'local';
}

/**
 * Encrypt a File or Blob client-side using a fresh AES-256-GCM symmetric key
 */
export async function encryptFileBlob(file: File): Promise<EncryptedFilePayload> {
  // 1. Generate a cryptographic 256-bit symmetric key
  const cryptoKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Export key to Base64 so it can be sealed inside the E2EE message
  const rawKey = await window.crypto.subtle.exportKey('raw', cryptoKey);
  const fileKeyBase64 = bufferToBase64(rawKey);

  // 3. Generate 12-byte random initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const fileIvBase64 = bufferToBase64(iv);

  // 4. Read raw file bytes
  const fileBuffer = await file.arrayBuffer();

  // 5. Encrypt with AES-GCM
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    fileBuffer
  );

  // 6. Wrap in binary blob for zero-knowledge upload
  const encryptedBlob = new Blob([ciphertextBuffer], {
    type: 'application/octet-stream',
  });

  return {
    encryptedBlob,
    fileKey: fileKeyBase64,
    fileIv: fileIvBase64,
    originalName: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
  };
}

/**
 * Decrypt an encrypted binary ArrayBuffer in-browser using the sealed fileKey and fileIv
 */
export async function decryptFileBlob(
  encryptedBuffer: ArrayBuffer,
  fileKeyBase64: string,
  fileIvBase64: string,
  mimeType: string
): Promise<Blob> {
  const rawKeyBytes = base64ToBuffer(fileKeyBase64);
  const ivBytes = base64ToBuffer(fileIvBase64);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    rawKeyBytes as unknown as BufferSource,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as unknown as BufferSource },
    cryptoKey,
    encryptedBuffer
  );

  return new Blob([decryptedBuffer], { type: mimeType || 'application/octet-stream' });
}

/**
 * Format bytes into human-readable string (e.g. 2.4 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
