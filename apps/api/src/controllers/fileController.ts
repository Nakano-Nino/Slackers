import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { fileService } from '../services/fileService.js';
import { ApiResponse } from '../types/index.js';

export const uploadEncryptedFile = async (
  req: AuthRequest,
  res: Response<ApiResponse<any>>
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to upload files',
      timestamp: new Date().toISOString(),
    });
  }

  const rawBuffer = req.body;
  if (!rawBuffer || !Buffer.isBuffer(rawBuffer) || rawBuffer.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No binary file content received. Expected application/octet-stream payload.',
      timestamp: new Date().toISOString(),
    });
  }

  // Max 50 MB
  if (rawBuffer.length > 50 * 1024 * 1024) {
    return res.status(413).json({
      success: false,
      error: 'File exceeds maximum upload limit of 50 MB.',
      timestamp: new Date().toISOString(),
    });
  }

  const rawName = (req.headers['x-file-name'] as string) || 'attachment.bin';
  let originalName = 'attachment.bin';
  try {
    originalName = decodeURIComponent(rawName);
  } catch {
    originalName = rawName;
  }

  const mimeType = (req.headers['x-file-type'] as string) || 'application/octet-stream';

  try {
    const record = await fileService.saveEncryptedFile(
      rawBuffer,
      originalName,
      mimeType,
      req.user.id
    );

    res.status(201).json({
      success: true,
      data: {
        fileId: record.id,
        fileUrl: `/api/files/${record.id}`,
        originalName: record.originalName,
        mimeType: record.mimeType,
        size: record.size,
        storage: record.storage,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Failed to save encrypted file',
      timestamp: new Date().toISOString(),
    });
  }
};

export const downloadEncryptedFile = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to download files',
      timestamp: new Date().toISOString(),
    });
  }

  const fileId = Array.isArray(req.params.fileId) ? req.params.fileId[0] : req.params.fileId;
  const result = await fileService.getEncryptedFile(fileId);

  if (!result) {
    return res.status(404).json({
      success: false,
      error: 'Encrypted file not found',
      timestamp: new Date().toISOString(),
    });
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', result.buffer.length);
  res.setHeader('X-Storage-Backend', result.record.storage);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(result.record.originalName)}.enc"`
  );

  return res.send(result.buffer);
};
