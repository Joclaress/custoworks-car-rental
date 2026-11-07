import multer from 'multer';
import { env } from '../config/env';
import { AppError } from '../lib/errors';

export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const DOC_MIME = [...IMAGE_MIME, 'application/pdf'];

function make(allowed: string[]) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (!allowed.includes(file.mimetype)) {
        return cb(AppError.badRequest(`Unsupported file type. Allowed: ${allowed.join(', ')}`));
      }
      cb(null, true);
    },
  });
}

/** Rental requirements & payment proofs: JPG, PNG, WEBP, PDF. */
export const uploadDocument = make(DOC_MIME).single('file');
/** Vehicle photos & QR codes: JPG, PNG, WEBP. */
export const uploadImage = make(IMAGE_MIME).single('file');

/**
 * Verify file signature (magic bytes) so a renamed executable cannot be
 * uploaded with a spoofed Content-Type.
 */
export function assertFileSignature(buf: Buffer, mime: string) {
  const hex = buf.subarray(0, 12).toString('hex');
  const ok =
    (mime === 'image/jpeg' && hex.startsWith('ffd8ff')) ||
    (mime === 'image/png' && hex.startsWith('89504e47')) ||
    (mime === 'image/webp' && hex.startsWith('52494646') && buf.subarray(8, 12).toString() === 'WEBP') ||
    (mime === 'application/pdf' && buf.subarray(0, 5).toString() === '%PDF-');
  if (!ok) throw AppError.badRequest('The uploaded file content does not match its type');
}

