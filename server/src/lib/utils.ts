import { Prisma } from '@prisma/client';
import crypto from 'node:crypto';

/** Money helpers – all arithmetic is done in centavos (integers) to avoid float errors. */
export const toCents = (v: Prisma.Decimal | number | string | null | undefined): number =>
  v === null || v === undefined ? 0 : Math.round(Number(v) * 100);
export const fromCents = (c: number): number => Math.round(c) / 100;
export const peso = (v: number | Prisma.Decimal | string) =>
  '₱' + Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Human-friendly unique references, e.g. CW-261103-7K4Q2 */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function randomCode(len = 5) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}
export function makeReference(prefix: string, date = new Date()) {
  const ymd = date.toISOString().slice(2, 10).replace(/-/g, '');
  return `${prefix}-${ymd}-${randomCode(5)}`;
}

export const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

export function cleanWin1252(v: string | null | undefined): string {
  if (!v) return '';
  return v
    .replace(/\uFFFD/g, '')
    .replace(/\u20b1/g, 'PHP ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');
}

export function formatManila(d: Date | string, withTime = true) {
  return new Date(d).toLocaleString('en-PH', {
    timeZone: process.env.APP_TIMEZONE || 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Remove keys with undefined values (handy for PATCH payloads). */
export function compact<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export function paginate(query: { page?: unknown; pageSize?: unknown }) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
}

