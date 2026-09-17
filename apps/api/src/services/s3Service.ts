import dotenv from 'dotenv';
dotenv.config();
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export interface S3Health {
  status: 'connected' | 'disconnected' | 'local';
  endpoint?: string;
  bucket?: string;
  error?: string;
}

class S3Service {
  private s3Client: S3Client | null = null;
  private bucket: string;
  private endpoint: string | undefined;
  private isConfigured: boolean = false;
  private uploadsDir: string;

  constructor() {
    this.endpoint = process.env.S3_ENDPOINT;
    this.bucket = process.env.S3_BUCKET_NAME || 'slackers-encrypted-files';
    this.uploadsDir = path.resolve(process.cwd(), 'uploads');

    // Ensure local fallback storage directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    this.initS3();
  }

  private initS3() {
    if (!this.endpoint) {
      console.log('ℹ️  S3_ENDPOINT not configured. FileService operating in local disk fallback mode.');
      return;
    }

    try {
      this.s3Client = new S3Client({
        endpoint: this.endpoint,
        region: process.env.S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
        },
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      });
      this.isConfigured = true;
      this.ensureBucketExists().catch((err) => {
        console.warn('⚠️  MinIO / S3 bucket check warning:', (err as Error).message);
      });
    } catch (err) {
      console.warn('⚠️  Failed to initialize S3 client, falling back to local disk:', (err as Error).message);
      this.isConfigured = false;
    }
  }

  private async ensureBucketExists(): Promise<void> {
    if (!this.s3Client) return;
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch (err: any) {
      // 404 or NotFound means bucket needs creation
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          console.log(`⚡ MinIO bucket "${this.bucket}" created successfully.`);
        } catch (createErr) {
          console.warn(`Could not create bucket "${this.bucket}":`, (createErr as Error).message);
        }
      }
    }
  }

  async uploadObject(
    key: string,
    buffer: Buffer,
    contentType: string = 'application/octet-stream'
  ): Promise<{ storage: 'minio' | 'local'; key: string }> {
    if (this.isConfigured && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          })
        );
        return { storage: 'minio', key };
      } catch (err) {
        console.warn(`MinIO upload failed for key "${key}", saving to local disk fallback:`, (err as Error).message);
      }
    }

    // Local disk fallback
    const localPath = path.join(this.uploadsDir, key);
    await fs.promises.writeFile(localPath, buffer);
    return { storage: 'local', key };
  }

  async downloadObject(key: string): Promise<{ buffer: Buffer; contentType: string; storage: 'minio' | 'local' }> {
    if (this.isConfigured && this.s3Client) {
      try {
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
          })
        );

        if (response.Body) {
          const stream = response.Body as Readable;
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          return {
            buffer: Buffer.concat(chunks),
            contentType: response.ContentType || 'application/octet-stream',
            storage: 'minio',
          };
        }
      } catch (err) {
        // Fall back to local disk if MinIO object is not found or fails
        console.warn(`MinIO download failed for key "${key}", reading from local disk:`, (err as Error).message);
      }
    }

    // Local disk lookup
    const localPath = path.join(this.uploadsDir, key);
    if (!fs.existsSync(localPath)) {
      throw new Error(`File "${key}" not found in storage.`);
    }

    const buffer = await fs.promises.readFile(localPath);
    return {
      buffer,
      contentType: 'application/octet-stream',
      storage: 'local',
    };
  }

  async deleteObject(key: string): Promise<void> {
    if (this.isConfigured && this.s3Client) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
          })
        );
      } catch (err) {
        console.warn(`MinIO delete failed for key "${key}":`, (err as Error).message);
      }
    }

    const localPath = path.join(this.uploadsDir, key);
    if (fs.existsSync(localPath)) {
      try {
        await fs.promises.unlink(localPath);
      } catch {
        // Ignore deletion error
      }
    }
  }

  async checkHealth(): Promise<S3Health> {
    if (!this.endpoint) {
      return { status: 'local' };
    }

    if (!this.s3Client) {
      return { status: 'disconnected', endpoint: this.endpoint, bucket: this.bucket };
    }

    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      return {
        status: 'connected',
        endpoint: this.endpoint,
        bucket: this.bucket,
      };
    } catch (err: any) {
      return {
        status: 'disconnected',
        endpoint: this.endpoint,
        bucket: this.bucket,
        error: (err as Error).message,
      };
    }
  }
}

export const s3Service = new S3Service();
