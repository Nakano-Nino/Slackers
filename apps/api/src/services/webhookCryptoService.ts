import crypto from 'crypto';

const channelKeyCache = new Map<string, Buffer>();

/**
 * Derives a deterministic symmetric AES-256-GCM key for a channel using PBKDF2.
 * Exactly mirrors E2EEService.getChannelKey in apps/web/src/lib/e2ee.ts.
 */
export function deriveChannelKeyNode(channelId: string): Buffer {
  const cached = channelKeyCache.get(channelId);
  if (cached) return cached;

  const password = Buffer.from(`slackers_channel_group_key_salt_${channelId}`, 'utf8');
  const salt = Buffer.from(`salt_${channelId}_group_v1`, 'utf8');
  const iterations = 50000;
  const keyLength = 32; // 256 bits

  const key = crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
  channelKeyCache.set(channelId, key);
  return key;
}

/**
 * Encrypts a message using AES-256-GCM matching WebCrypto Subtle format
 * (ciphertext followed by 16-byte authentication tag).
 */
export function encryptChannelMessageNode(
  plaintext: string,
  channelId: string
): { ciphertext: string; iv: string } {
  const key = deriveChannelKeyNode(channelId);
  const iv = crypto.randomBytes(12); // 96-bit standard AES-GCM IV

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // WebCrypto SubtleCrypto outputs ciphertext + 16-byte auth tag concatenated
  const fullCiphertext = Buffer.concat([encrypted, tag]);

  return {
    ciphertext: fullCiphertext.toString('base64'),
    iv: iv.toString('base64'),
  };
}

/**
 * Decrypts a channel message encrypted with AES-256-GCM.
 */
export function decryptChannelMessageNode(
  ciphertextBase64: string,
  ivBase64: string,
  channelId: string
): string {
  const key = deriveChannelKeyNode(channelId);
  const iv = Buffer.from(ivBase64, 'base64');
  const full = Buffer.from(ciphertextBase64, 'base64');

  if (full.length < 16) {
    throw new Error('Ciphertext too short to contain AES-GCM auth tag');
  }

  const data = full.subarray(0, full.length - 16);
  const tag = full.subarray(full.length - 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Validates HMAC-SHA256 signatures in constant time to eliminate timing side-channel attacks.
 * Supports standard signatures and GitHub 'sha256=' prefixed headers.
 */
export function verifyHmacSha256(
  rawBody: Buffer | string,
  signatureHeader: string | undefined | null,
  secret: string | undefined | null
): boolean {
  if (!signatureHeader || !secret) return false;

  const cleanSig = signatureHeader.startsWith('sha256=')
    ? signatureHeader.substring(7)
    : signatureHeader;

  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(cleanSig, 'hex');
  const expectedBuf = Buffer.from(expectedHex, 'hex');

  if (sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

/**
 * Secure high-entropy token generators
 */
export function generateWebhookToken(): string {
  return `whk_${crypto.randomBytes(24).toString('base64url')}`;
}

export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}
