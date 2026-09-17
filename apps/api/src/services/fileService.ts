import { s3Service } from './s3Service.js';
import { mongoLogger } from './mongoLogger.js';

export interface EncryptedFileRecord {
  id: string;
  uploaderId: string;
  originalName: string;
  mimeType: string;
  size: number;
  storage: 'minio' | 'local';
  createdAt: string;
}

class FileService {
  private files: Map<string, EncryptedFileRecord> = new Map();

  async saveEncryptedFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    uploaderId: string
  ): Promise<EncryptedFileRecord> {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Upload raw encrypted binary blob to MinIO / S3 (or local disk fallback)
    const { storage } = await s3Service.uploadObject(fileId, buffer, mimeType);

    const record: EncryptedFileRecord = {
      id: fileId,
      uploaderId,
      originalName,
      mimeType,
      size: buffer.length,
      storage,
      createdAt: new Date().toISOString(),
    };

    this.files.set(fileId, record);

    // Audit log (without logging the file data)
    await mongoLogger.log('FILE_UPLOADED', {
      fileId,
      uploaderId,
      originalName,
      size: buffer.length,
      storage,
      encrypted: true,
      algorithm: 'AES-GCM-256',
    });

    return record;
  }

  async getEncryptedFile(fileId: string): Promise<{ buffer: Buffer; record: EncryptedFileRecord } | null> {
    let record = this.files.get(fileId);
    if (!record) {
      // In case server restarted, synthesize a fallback record if file exists in S3/disk
      record = {
        id: fileId,
        uploaderId: 'unknown',
        originalName: 'encrypted-attachment.bin',
        mimeType: 'application/octet-stream',
        size: 0,
        storage: 'local',
        createdAt: new Date().toISOString(),
      };
    }

    try {
      const { buffer, storage } = await s3Service.downloadObject(fileId);
      record.size = buffer.length;
      record.storage = storage;
      return { buffer, record };
    } catch {
      return null;
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const record = this.files.get(fileId);
    if (!record) return false;

    await s3Service.deleteObject(fileId);
    this.files.delete(fileId);
    return true;
  }
}

export const fileService = new FileService();
