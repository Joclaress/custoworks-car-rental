import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { AppError } from '../lib/errors';
import { assertFileSignature } from '../middleware/upload';

/**
 * Storage abstraction.
 *  - visibility "public": vehicle photos, payment QR codes (served via URL)
 *  - visibility "private": IDs, licenses, selfies, payment receipts. NEVER exposed
 *    via public URL; streamed through authenticated endpoints only.
 */
export interface StoredFile {
  provider: 'local' | 'cloudinary';
  key: string;
  url?: string;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const localRoot = path.resolve(process.cwd(), env.LOCAL_UPLOAD_DIR);
export const localPublicDir = path.join(localRoot, 'public');
const localPrivateDir = path.join(localRoot, 'private');

if (env.STORAGE_DRIVER === 'cloudinary') {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function saveFile(
  file: { buffer: Buffer; mimetype: string },
  opts: { folder: string; visibility: 'public' | 'private' },
): Promise<StoredFile> {
  assertFileSignature(file.buffer, file.mimetype);
  const id = crypto.randomUUID();
  const ext = EXT[file.mimetype] ?? 'bin';

  if (env.STORAGE_DRIVER === 'cloudinary') {
    const result = await new Promise<{ public_id: string; secure_url: string; format?: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `${env.CLOUDINARY_FOLDER}/${opts.visibility}/${opts.folder}`,
            public_id: id,
            resource_type: 'image', // images and PDFs
            type: opts.visibility === 'private' ? 'authenticated' : 'upload',
          },
          (err, res) => (err || !res ? reject(err) : resolve(res as never)),
        )
        .end(file.buffer);
    });
    return {
      provider: 'cloudinary',
      key: `${result.public_id}.${result.format ?? ext}`,
      url: opts.visibility === 'public' ? result.secure_url : undefined,
    };
  }

  const baseDir = opts.visibility === 'public' ? localPublicDir : localPrivateDir;
  const rel = path.posix.join(opts.folder, `${id}.${ext}`);
  const abs = path.join(baseDir, rel);
  await fs.promises.mkdir(path.dirname(abs), { recursive: true });
  await fs.promises.writeFile(abs, file.buffer);
  return {
    provider: 'local',
    key: rel,
    url: opts.visibility === 'public' ? `${env.API_URL}/uploads/public/${rel}` : undefined,
  };
}

/** Streams a private file to an (already authorised) response. */
export async function sendPrivateFile(res: Response, provider: string, key: string, mime?: string | null) {
  if (provider === 'cloudinary') {
    const dot = key.lastIndexOf('.');
    const publicId = key.slice(0, dot);
    const format = key.slice(dot + 1);
    const url = cloudinary.utils.private_download_url(publicId, format, {
      type: 'authenticated',
      resource_type: 'image',
      expires_at: Math.floor(Date.now() / 1000) + 120, // 2-minute signed URL
    });
    return res.redirect(302, url);
  }
  const abs = path.resolve(localPrivateDir, key);
  if (!abs.startsWith(localPrivateDir) || !fs.existsSync(abs)) throw AppError.notFound('File not found');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (mime) res.type(mime);
  res.sendFile(abs);
}

export async function deleteFile(provider: string, key: string, visibility: 'public' | 'private') {
  try {
    if (provider === 'cloudinary') {
      const publicId = key.slice(0, key.lastIndexOf('.'));
      await cloudinary.uploader.destroy(publicId, {
        resource_type: 'image',
        type: visibility === 'private' ? 'authenticated' : 'upload',
      });
      return;
    }
    const abs = path.resolve(visibility === 'public' ? localPublicDir : localPrivateDir, key);
    await fs.promises.unlink(abs);
  } catch {
    /* best effort */
  }
}

