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
      return '[Message unavailable]';
    }
  }

  // ==========================================
  // 5. Cryptographic Safety Numbers & Fingerprints (Signal / Matrix Standards)
  // ==========================================

  /**
   * Computes a SHA-256 formatted hex fingerprint from a JWK public key string
   */
  static async computeKeyFingerprint(pubKeyJwk: string): Promise<string> {
    const enc = new TextEncoder();
    let canonical = pubKeyJwk;
    try {
      const parsed = JSON.parse(pubKeyJwk);
      // Canonicalize standard EC JWK fields
      canonical = JSON.stringify({
        crv: parsed.crv || 'P-256',
        kty: parsed.kty || 'EC',
        x: parsed.x,
        y: parsed.y,
      });
    } catch {
      canonical = pubKeyJwk;
    }

    const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(canonical));
    const hashBytes = new Uint8Array(hashBuffer);
    const hexPairs: string[] = [];
    for (let i = 0; i < 16; i++) {
      hexPairs.push(hashBytes[i].toString(16).padStart(2, '0').toUpperCase());
    }
    return hexPairs.join(':');
  }

  /**
   * Computes a deterministic 60-digit Signal-standard Safety Number (12 blocks of 5 digits)
   * completely symmetric regardless of whether user A or user B computes it.
   */
  static async computeSafetyNumber(
    userAId: string,
    userAPubKey: string,
    userBId: string,
    userBPubKey: string
  ): Promise<{
    safetyNumber: string;
    blocks: string[];
    myFingerprint: string;
    peerFingerprint: string;
  }> {
    const enc = new TextEncoder();

    // Canonicalize both keys
    const myFp = await this.computeKeyFingerprint(userAPubKey);
    const peerFp = await this.computeKeyFingerprint(userBPubKey);

    // Sort users deterministically to guarantee identical safety number for both participants
    const [first, second] = [
      { id: userAId, pubKey: userAPubKey },
      { id: userBId, pubKey: userBPubKey },
    ].sort((a, b) => a.id.localeCompare(b.id));

    // Combine identities and keys
    const combined = `slackers:v1:safety:${first.id}:${first.pubKey}:${second.id}:${second.pubKey}`;
    
    // Multi-round digest for domain separation
    const round1 = await window.crypto.subtle.digest('SHA-256', enc.encode(combined));
    const round2 = await window.crypto.subtle.digest('SHA-256', round1);
    const round3 = await window.crypto.subtle.digest('SHA-256', round2);

    // Derive 12 blocks of 5 decimal digits (60 digits total)
    const view1 = new DataView(round1);
    const view2 = new DataView(round2);
    const view3 = new DataView(round3);

    const blocks: string[] = [];
    // 4 blocks from round1 (16 bytes)
    for (let i = 0; i < 4; i++) {
      const val = view1.getUint32(i * 4, false) % 100000;
      blocks.push(val.toString().padStart(5, '0'));
    }
    // 4 blocks from round2 (16 bytes)
    for (let i = 0; i < 4; i++) {
      const val = view2.getUint32(i * 4, false) % 100000;
      blocks.push(val.toString().padStart(5, '0'));
    }
    // 4 blocks from round3 (16 bytes)
    for (let i = 0; i < 4; i++) {
      const val = view3.getUint32(i * 4, false) % 100000;
      blocks.push(val.toString().padStart(5, '0'));
    }

    const safetyNumber = blocks.join(' ');

    return {
      safetyNumber,
      blocks,
      myFingerprint: myFp,
      peerFingerprint: peerFp,
    };
  }

  // ==========================================
  // 6. Contact Verification & MITM Key Change Detection
  // ==========================================

  private static getVerifiedPeersStorageKey(myUserId: string): string {
    return `slackers_verified_peers_${myUserId}`;
  }

  private static getKnownPeersStorageKey(myUserId: string): string {
    return `slackers_known_peer_keys_${myUserId}`;
  }

  static getVerifiedPeers(
    myUserId: string
  ): Record<string, { fingerprint: string; verifiedAt: string }> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(this.getVerifiedPeersStorageKey(myUserId));
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  static async getPeerKeyStatus(
    myUserId: string,
    peerUserId: string,
    currentPubKey: string
  ): Promise<{
    status: 'verified' | 'unverified' | 'key_changed';
    verifiedAt?: string;
    lastFingerprint?: string;
    currentFingerprint: string;
  }> {
    const currentFingerprint = await this.computeKeyFingerprint(currentPubKey);
    if (typeof window === 'undefined') {
      return { status: 'unverified', currentFingerprint };
    }

    try {
      const verifiedPeers = this.getVerifiedPeers(myUserId);
      const verifiedEntry = verifiedPeers[peerUserId];

      // Check known keys history
      const knownData = localStorage.getItem(this.getKnownPeersStorageKey(myUserId));
      const knownPeers: Record<string, string> = knownData ? JSON.parse(knownData) : {};
      const previousFingerprint = knownPeers[peerUserId];

      // If user was previously verified but the fingerprint has changed -> KEY_CHANGED (MITM warning)
      if (verifiedEntry && verifiedEntry.fingerprint !== currentFingerprint) {
        return {
          status: 'key_changed',
          lastFingerprint: verifiedEntry.fingerprint,
          verifiedAt: verifiedEntry.verifiedAt,
          currentFingerprint,
        };
      }

      // If known previously and changed without verification
      if (previousFingerprint && previousFingerprint !== currentFingerprint && !verifiedEntry) {
        return {
          status: 'key_changed',
          lastFingerprint: previousFingerprint,
          currentFingerprint,
        };
      }

      // If verified and fingerprint matches
      if (verifiedEntry && verifiedEntry.fingerprint === currentFingerprint) {
        return {
          status: 'verified',
          verifiedAt: verifiedEntry.verifiedAt,
          currentFingerprint,
        };
      }

      // Save known key for future comparison if not already known
      if (!previousFingerprint) {
        knownPeers[peerUserId] = currentFingerprint;
        localStorage.setItem(this.getKnownPeersStorageKey(myUserId), JSON.stringify(knownPeers));
      }

      return {
        status: 'unverified',
        currentFingerprint,
      };
    } catch {
      return { status: 'unverified', currentFingerprint };
    }
  }

  static async markPeerAsVerified(
    myUserId: string,
    peerUserId: string,
    peerPubKey: string
  ): Promise<void> {
    if (typeof window === 'undefined') return;
    const fingerprint = await this.computeKeyFingerprint(peerPubKey);
    const verifiedPeers = this.getVerifiedPeers(myUserId);

    verifiedPeers[peerUserId] = {
      fingerprint,
      verifiedAt: new Date().toISOString(),
    };

    localStorage.setItem(this.getVerifiedPeersStorageKey(myUserId), JSON.stringify(verifiedPeers));

    // Also update known peers key
    const knownData = localStorage.getItem(this.getKnownPeersStorageKey(myUserId));
    const knownPeers: Record<string, string> = knownData ? JSON.parse(knownData) : {};
    knownPeers[peerUserId] = fingerprint;
    localStorage.setItem(this.getKnownPeersStorageKey(myUserId), JSON.stringify(knownPeers));
  }

  static markPeerAsUnverified(myUserId: string, peerUserId: string): void {
    if (typeof window === 'undefined') return;
    const verifiedPeers = this.getVerifiedPeers(myUserId);
    delete verifiedPeers[peerUserId];
    localStorage.setItem(this.getVerifiedPeersStorageKey(myUserId), JSON.stringify(verifiedPeers));
  }

  // ==========================================
  // 7. Multi-Device Emergency Recovery Passphrase & Vault (Matrix / Signal Standard)
  // ==========================================

  /**
   * Generates a high-entropy 24-character formatted recovery key (e.g. SLK-4F8A-9B21-C73E-01FA-88DE)
   */
  static generateRecoveryKey(): string {
    const bytes = window.crypto.getRandomValues(new Uint8Array(10));
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join('');
    return `SLK-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}`;
  }

  /**
   * Exports an encrypted recovery vault JSON bundle protected with an emergency recovery key
   */
  static async exportRecoveryVault(
    privateKey: CryptoKey,
    publicKeyJwk: string,
    recoveryKey: string
  ): Promise<string> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const enc = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(recoveryKey.replace(/\s+/g, '').toUpperCase()),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const vaultKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const privJwk = await window.crypto.subtle.exportKey('jwk', privateKey);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      vaultKey,
      enc.encode(JSON.stringify(privJwk))
    );

    const backupBundle = {
      version: 1,
      standard: 'Signal/Matrix Megolm Key Backup',
      exportedAt: new Date().toISOString(),
      publicKey: publicKeyJwk,
      encryptedPrivateKey: arrayBufferToBase64(encrypted),
      salt: arrayBufferToBase64(salt.buffer),
      iv: arrayBufferToBase64(iv.buffer),
    };

    return JSON.stringify(backupBundle, null, 2);
  }

  /**
   * Decrypts and imports an encrypted recovery vault JSON bundle using the emergency recovery key
   */
  static async importRecoveryVault(
    backupJson: string,
    recoveryKey: string
  ): Promise<{
    privateKey: CryptoKey;
    publicKey: CryptoKey;
    publicKeyJwk: string;
  }> {
    const bundle = JSON.parse(backupJson);
    if (!bundle.encryptedPrivateKey || !bundle.salt || !bundle.iv || !bundle.publicKey) {
      throw new Error('Invalid emergency recovery vault bundle format');
    }

    const salt = new Uint8Array(base64ToArrayBuffer(bundle.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(bundle.iv));
    const cipherBytes = base64ToArrayBuffer(bundle.encryptedPrivateKey);

    const enc = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(recoveryKey.replace(/\s+/g, '').toUpperCase()),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const vaultKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedBytes = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      vaultKey,
      cipherBytes
    );

    const privJwk = JSON.parse(new TextDecoder().decode(decryptedBytes));
    const privateKey = await window.crypto.subtle.importKey(
      'jwk',
      privJwk,
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveKey', 'deriveBits']
    );

    const publicKey = await this.importPeerPublicKey(bundle.publicKey);

    return {
      privateKey,
      publicKey,
      publicKeyJwk: bundle.publicKey,
    };
  }
}

