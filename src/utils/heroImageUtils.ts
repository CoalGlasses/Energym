import { mkdir, readdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const MAX_HERO_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_IMAGE_MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export interface TrainerOverride {
  name?: string;
  speciality?: string;
  experienceYears?: number;
  photoUrl?: string;
}

export interface SiteAppearanceSettings {
  heroImageUrl: string;
  galleryImages: Record<string, string>;
  trainers: Record<string, TrainerOverride>;
  updatedAt: string;
}

export type ParsedImageDataUrl =
  | {
      ok: true;
      mimeType: string;
      extension: string;
      buffer: Buffer;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Validates a slot ID string (e.g. "free-weights", "coach-rohit") against safe slug rules.
 */
export function isValidSlotId(slotId: string): boolean {
  return /^[a-z0-9-]{2,40}$/.test(slotId);
}

/**
 * Validates and decodes a base64 image data URL for server-side image storage.
 */
export function parseImageDataUrl(dataUrl: string): ParsedImageDataUrl {
  const trimmed = dataUrl.trim();
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i.exec(trimmed);
  if (!match) {
    return {
      ok: false,
      error: 'Please choose a valid JPG, PNG, WebP, AVIF, or GIF image file.',
    };
  }

  const mimeType = match[1].toLowerCase();
  const extension = ALLOWED_IMAGE_MIME_EXTENSIONS[mimeType];
  if (!extension) {
    return {
      ok: false,
      error: 'Unsupported image format. Use JPG, PNG, WebP, AVIF, or GIF.',
    };
  }

  const cleanBase64 = match[2].replace(/\s+/g, '');
  if (!cleanBase64) {
    return { ok: false, error: 'Uploaded image file is empty.' };
  }

  const buffer = Buffer.from(cleanBase64, 'base64');
  if (buffer.length === 0) {
    return { ok: false, error: 'Uploaded image file could not be decoded.' };
  }

  if (buffer.length > MAX_HERO_IMAGE_BYTES) {
    return {
      ok: false,
      error: 'Image must be 8 MB or smaller.',
    };
  }

  return {
    ok: true,
    mimeType,
    extension,
    buffer,
  };
}

/**
 * Validates an external http(s) URL or site-relative upload path for any site image.
 */
export function validateHeroImageUrl(
  input: string
): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: true, url: '' };
  }

  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/assets/')) {
    if (trimmed.includes('..') || /\s/.test(trimmed)) {
      return { ok: false, error: 'Enter a valid image path without spaces.' };
    }
    return { ok: true, url: trimmed };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, error: 'Image URL must start with http:// or https://.' };
    }
    return { ok: true, url: parsed.toString() };
  } catch {
    return {
      ok: false,
      error: 'Enter a valid image URL (starting with https://) or upload a photo.',
    };
  }
}

/**
 * Validates and normalizes editable trainer profile text fields.
 */
export function validateTrainerProfileFields(input: {
  name?: unknown;
  speciality?: unknown;
  experienceYears?: unknown;
}):
  | { ok: true; fields: Pick<TrainerOverride, 'name' | 'speciality' | 'experienceYears'> }
  | { ok: false; error: string } {
  const fields: Pick<TrainerOverride, 'name' | 'speciality' | 'experienceYears'> = {};

  if (typeof input.name === 'string') {
    const trimmed = input.name.trim();
    if (trimmed.length > 0 && trimmed.length < 2) {
      return { ok: false, error: 'Trainer name must be at least 2 characters.' };
    }
    if (trimmed.length > 60) {
      return { ok: false, error: 'Trainer name must be 60 characters or fewer.' };
    }
    if (trimmed) {
      fields.name = trimmed;
    }
  }

  if (typeof input.speciality === 'string') {
    const trimmed = input.speciality.trim();
    if (trimmed.length > 80) {
      return { ok: false, error: 'Speciality must be 80 characters or fewer.' };
    }
    if (trimmed) {
      fields.speciality = trimmed;
    }
  }

  if (input.experienceYears !== undefined && input.experienceYears !== '') {
    const num = Number(input.experienceYears);
    if (!Number.isFinite(num) || num < 0 || num > 60) {
      return { ok: false, error: 'Experience years must be between 0 and 60.' };
    }
    fields.experienceYears = Math.round(num);
  }

  return { ok: true, fields };
}

function sanitizeTrainerRecord(raw: unknown): Record<string, TrainerOverride> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, TrainerOverride> = {};

  for (const [id, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!isValidSlotId(id) || !entry || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    const clean: TrainerOverride = {};
    if (typeof item.name === 'string' && item.name.trim()) {
      clean.name = item.name.trim().slice(0, 60);
    }
    if (typeof item.speciality === 'string' && item.speciality.trim()) {
      clean.speciality = item.speciality.trim().slice(0, 80);
    }
    if (typeof item.experienceYears === 'number' && Number.isFinite(item.experienceYears)) {
      clean.experienceYears = Math.max(0, Math.min(60, Math.round(item.experienceYears)));
    }
    if (typeof item.photoUrl === 'string' && item.photoUrl.trim()) {
      clean.photoUrl = item.photoUrl.trim();
    }
    if (Object.keys(clean).length > 0) {
      result[id] = clean;
    }
  }

  return result;
}

function sanitizeGalleryRecord(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [id, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!isValidSlotId(id) || typeof val !== 'string' || !val.trim()) continue;
    result[id] = val.trim();
  }
  return result;
}

export async function readSiteAppearanceFromFile(
  filePath: string
): Promise<SiteAppearanceSettings> {
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SiteAppearanceSettings>;
    return {
      heroImageUrl: typeof parsed.heroImageUrl === 'string' ? parsed.heroImageUrl.trim() : '',
      galleryImages: sanitizeGalleryRecord(parsed.galleryImages),
      trainers: sanitizeTrainerRecord(parsed.trainers),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { heroImageUrl: '', galleryImages: {}, trainers: {}, updatedAt: '' };
    }
    throw error;
  }
}

export async function writeSiteAppearanceSettingsToFile(
  filePath: string,
  settings: Omit<SiteAppearanceSettings, 'updatedAt'>
): Promise<SiteAppearanceSettings> {
  const next: SiteAppearanceSettings = {
    heroImageUrl: settings.heroImageUrl.trim(),
    galleryImages: sanitizeGalleryRecord(settings.galleryImages),
    trainers: sanitizeTrainerRecord(settings.trainers),
    updatedAt: new Date().toISOString(),
  };
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(next, null, 2), 'utf8');
  return next;
}

/**
 * Backwards-compatible helper that updates only heroImageUrl while preserving gallery & trainer overrides.
 */
export async function writeSiteAppearanceToFile(
  filePath: string,
  heroImageUrl: string
): Promise<SiteAppearanceSettings> {
  const current = await readSiteAppearanceFromFile(filePath);
  return writeSiteAppearanceSettingsToFile(filePath, {
    ...current,
    heroImageUrl,
  });
}

/**
 * Saves an uploaded image buffer inside uploadsDir under `<slotKey>-<timestamp>.<ext>`
 * and removes any older files belonging to that specific slot.
 */
export async function saveUploadedSlotImageFile(
  uploadsDir: string,
  slotKey: string,
  extension: string,
  buffer: Buffer,
  timestamp = Date.now()
): Promise<string> {
  await mkdir(uploadsDir, { recursive: true });
  await removeUploadedSlotImageFiles(uploadsDir, slotKey);

  const safeSlotKey = slotKey.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  const fileName = `${safeSlotKey}-${timestamp}.${extension}`;
  await writeFile(join(uploadsDir, fileName), buffer);
  return `/uploads/${fileName}`;
}

export async function removeUploadedSlotImageFiles(
  uploadsDir: string,
  slotKey: string
): Promise<void> {
  const safeSlotKey = slotKey.replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
  const prefix = `${safeSlotKey}-`;
  try {
    const entries = await readdir(uploadsDir);
    await Promise.all(
      entries
        .filter((name) => name.startsWith(prefix))
        .map((name) => unlink(join(uploadsDir, name)).catch(() => undefined))
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

export async function saveUploadedHeroImageFile(
  uploadsDir: string,
  extension: string,
  buffer: Buffer,
  timestamp = Date.now()
): Promise<string> {
  return saveUploadedSlotImageFile(uploadsDir, 'hero', extension, buffer, timestamp);
}

export async function removeUploadedHeroImageFiles(uploadsDir: string): Promise<void> {
  return removeUploadedSlotImageFiles(uploadsDir, 'hero');
}
