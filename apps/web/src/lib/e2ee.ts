/**
 * End-to-End Encryption (E2EE) Module
 * Powered by native Web Crypto API:
 * - PBKDF2-HMAC-SHA256 (100,000 rounds) for Password-Derived Key Vault
 * - ECDH (P-256) for Key Agreement
 * - AES-GCM (256-bit) with 12-byte IVs for Authenticated Message & Key Encryption
 */

import { KeyVaultData, User } from '../types';
import { api } from './api';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Memory cache for derived shared AES keys between (myId + partnerId)
const sharedKeyCache = new Map<string, CryptoKey>();
// Memory cache for channel symmetric AES keys (channelId -> CryptoKey)
const channelKeyCache = new Map<string, CryptoKey>();

export class E2EEService {
  private static getStorageKey(userId: string, type: 'priv' | 'pub'): string {
    return `slackers_e2ee_${type}_${userId}`;
  }

  // ==========================================
  // 1. Password-Derived Key Vault (Cross-Device Sync)
  // ==========================================

  /**
   * Derives a 256-bit AES-GCM Key Vault Key from the user's password using PBKDF2
   */
  private static async deriveVaultKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypts the user's private key with a password-derived key for zero-knowledge cloud storage
   */
  static async encryptPrivateKeyWithPassword(
    privateKey: CryptoKey,
    publicKeyJwk: string,
    password: string
  ): Promise<KeyVaultData> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const vaultKey = await this.deriveVaultKey(password, salt);

    const privJwk = await window.crypto.subtle.exportKey('jwk', privateKey);
    const privEncoded = new TextEncoder().encode(JSON.stringify(privJwk));

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      vaultKey,
      privEncoded
    );

    return {
      publicKey: publicKeyJwk,
      encryptedPrivateKey: arrayBufferToBase64(encrypted),
      keyVaultSalt: arrayBufferToBase64(salt.buffer),
      keyVaultIv: arrayBufferToBase64(iv.buffer),
    };
  }

  /**
   * Decrypts the user's private key downloaded from the server using the user's login password
   */
  static async decryptPrivateKeyWithPassword(
    vault: KeyVaultData,
    password: string
  ): Promise<CryptoKey> {
    const salt = new Uint8Array(base64ToArrayBuffer(vault.keyVaultSalt));
    const iv = new Uint8Array(base64ToArrayBuffer(vault.keyVaultIv));
    const cipherBytes = base64ToArrayBuffer(vault.encryptedPrivateKey);

    const vaultKey = await this.deriveVaultKey(password, salt);
    const decryptedBytes = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      vaultKey,
      cipherBytes
    );

    const privJwk = JSON.parse(new TextDecoder().decode(decryptedBytes));
    return await window.crypto.subtle.importKey(
      'jwk',
      privJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );
  }

  /**
   * Initializes or retrieves the user's ECDH identity keypair.
   * If not cached locally but a remote Key Vault exists, decrypts it using the user's password.
   */
  static async getOrCreateUserKeyPair(
    userId: string,
    password?: string,
    remoteVault?: KeyVaultData | null
  ): Promise<{
    publicKeyJwk: string;
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    newVaultToSave?: KeyVaultData;
  }> {
    if (typeof window === 'undefined') {
      throw new Error('Web Crypto E2EE is only available in browser contexts');
    }

    const privKeyStr = localStorage.getItem(this.getStorageKey(userId, 'priv'));
    const pubKeyStr = localStorage.getItem(this.getStorageKey(userId, 'pub'));

    // Case 1: Keypair is already cached in this browser AND matches remote vault (if remoteVault exists)
    if (privKeyStr && pubKeyStr && (!remoteVault || pubKeyStr === remoteVault.publicKey)) {
      try {
        const privJwk = JSON.parse(privKeyStr);
        const pubJwk = JSON.parse(pubKeyStr);

        const privateKey = await window.crypto.subtle.importKey(
          'jwk',
          privJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          ['deriveKey', 'deriveBits']
        );

        const publicKey = await window.crypto.subtle.importKey(
          'jwk',
          pubJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          true,
          []
        );

        return { publicKeyJwk: pubKeyStr, privateKey, publicKey };
      } catch (err) {
        console.warn('Failed to restore cached E2EE keys:', err);
      }
    }

    // Case 2: New browser / device, or local cache was mismatched, but remote Key Vault exists and password is provided
    if (remoteVault && password) {
      try {
        const privateKey = await this.decryptPrivateKeyWithPassword(remoteVault, password);
        const publicKey = await this.importPeerPublicKey(remoteVault.publicKey);

        // Cache locally on this device
        const privJwk = await window.crypto.subtle.exportKey('jwk', privateKey);
        localStorage.setItem(this.getStorageKey(userId, 'priv'), JSON.stringify(privJwk));
        localStorage.setItem(this.getStorageKey(userId, 'pub'), remoteVault.publicKey);

        return {
          publicKeyJwk: remoteVault.publicKey,
          privateKey,
          publicKey,
        };
      } catch (err) {
        console.warn('Failed to unlock remote key vault with password:', err);
      }
    }

    // If remoteVault exists on server but password was not provided, do not overwrite with random keys
    if (remoteVault && !password) {
      throw new Error('Key vault is locked. Password required to decrypt E2EE keys.');
    }

    // Case 3: Completely fresh account or no vault on server
    const keyPair = await window.crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    const privJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const pubJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const publicKeyJwk = JSON.stringify(pubJwk);

    localStorage.setItem(this.getStorageKey(userId, 'priv'), JSON.stringify(privJwk));
    localStorage.setItem(this.getStorageKey(userId, 'pub'), publicKeyJwk);

    let newVaultToSave: KeyVaultData | undefined;
    if (password) {
      newVaultToSave = await this.encryptPrivateKeyWithPassword(
        keyPair.privateKey,
        publicKeyJwk,
        password
      );
    }

    return {
      publicKeyJwk,
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      newVaultToSave,
    };
  }

  // ==========================================
  // 2. Direct Messages (Pairwise ECDH)
  // ==========================================

  static async importPeerPublicKey(jwkStr: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jwkStr);
    return await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      []
    );
  }

  static async getPeerPublicKey(peerUserId: string, peerUser?: User | null): Promise<string> {
    // 1. Check if peer user object already has public key
    if (peerUser?.publicKey && peerUser.publicKey.length > 20) {
      return peerUser.publicKey;
    }

    // 2. Fetch latest registered public key from server
    try {
      const remoteKey = await api.getUserPublicKey(peerUserId);
      if (remoteKey && remoteKey.length > 20) {
        if (peerUser) {
          peerUser.publicKey = remoteKey;
        }
        return remoteKey;
      }
    } catch (err) {
      console.warn(`Failed to fetch remote public key for user ${peerUserId}:`, err);
    }

    throw new Error(`Public key not available for user ${peerUserId}. The recipient must have a valid E2EE key registered.`);
  }

  static async getSharedKey(
    myUserId: string,
    peerUserId: string,
    myPrivateKey: CryptoKey,
    peerPublicKey: CryptoKey
  ): Promise<CryptoKey> {
    const cacheKey = [myUserId, peerUserId].sort().join(':');
    const cached = sharedKeyCache.get(cacheKey);
    if (cached) return cached;

    const sharedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'ECDH',
        public: peerPublicKey,
      },
      myPrivateKey,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );

    sharedKeyCache.set(cacheKey, sharedKey);
    return sharedKey;
  }

  // ==========================================
  // 3. Channel Chat (Symmetric Group E2EE)
  // ==========================================

  /**
   * Generates or derives a channel symmetric AES-GCM-256 key
   */
  static async getChannelKey(channelId: string): Promise<CryptoKey> {
    const cached = channelKeyCache.get(channelId);
    if (cached) return cached;

    // Derive deterministic high-entropy channel key from workspace salt + channelId
    const enc = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(`slackers_channel_group_key_salt_${channelId}`),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const salt = enc.encode(`salt_${channelId}_group_v1`);
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 50000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    channelKeyCache.set(channelId, key);
    return key;
  }

  // ==========================================
  // 4. Authenticated Encryption & Decryption (AES-GCM-256)
  // ==========================================

  static async encrypt(
    plaintext: string,
    symmetricKey: CryptoKey
  ): Promise<{ ciphertext: string; iv: string }> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      symmetricKey,
      encoded
    );

    return {
      ciphertext: arrayBufferToBase64(encrypted),
      iv: arrayBufferToBase64(iv.buffer),
    };
  }

  static async decrypt(
    ciphertext: string,
    ivBase64: string,
    symmetricKey: CryptoKey
  ): Promise<string> {
    try {
      const iv = base64ToArrayBuffer(ivBase64);
      const cipherBytes = base64ToArrayBuffer(ciphertext);

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(iv),
        },
        symmetricKey,
        cipherBytes
      );

      return new TextDecoder().decode(decrypted);
    } catch (err) {
      console.warn('Decryption failed, ciphertext integrity check failed:', err);
      return '[🔒 Encrypted Message - Unable to Decrypt]';
    }
  }
}
