import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  isValidSlotId,
  MAX_HERO_IMAGE_BYTES,
  parseImageDataUrl,
  readSiteAppearanceFromFile,
  removeUploadedHeroImageFiles,
  removeUploadedSlotImageFiles,
  saveUploadedHeroImageFile,
  saveUploadedSlotImageFile,
  validateHeroImageUrl,
  validateTrainerProfileFields,
  writeSiteAppearanceSettingsToFile,
  writeSiteAppearanceToFile,
} from './heroImageUtils.ts';

test('parseImageDataUrl validates supported image MIME types and decodes base64', () => {
  const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const dataUrl = `data:image/png;base64,${pngBytes.toString('base64')}`;

  const parsed = parseImageDataUrl(dataUrl);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.mimeType, 'image/png');
    assert.equal(parsed.extension, 'png');
    assert.deepEqual(parsed.buffer, pngBytes);
  }
});

test('parseImageDataUrl rejects non-image or oversized payloads', () => {
  const svgAttempt = parseImageDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=');
  assert.equal(svgAttempt.ok, false);

  const invalidAttempt = parseImageDataUrl('not-a-data-url');
  assert.equal(invalidAttempt.ok, false);

  const oversized = Buffer.alloc(MAX_HERO_IMAGE_BYTES + 1024, 1);
  const largeAttempt = parseImageDataUrl(`data:image/jpeg;base64,${oversized.toString('base64')}`);
  assert.equal(largeAttempt.ok, false);
});

test('validateHeroImageUrl accepts https URLs and local uploads while blocking unsafe schemes', () => {
  const validHttps = validateHeroImageUrl('  https://images.example.com/gym.jpg  ');
  assert.equal(validHttps.ok, true);
  if (validHttps.ok) {
    assert.equal(validHttps.url, 'https://images.example.com/gym.jpg');
  }

  const validLocal = validateHeroImageUrl('/uploads/hero-12345.webp');
  assert.equal(validLocal.ok, true);

  const blank = validateHeroImageUrl('   ');
  assert.equal(blank.ok, true);
  if (blank.ok) {
    assert.equal(blank.url, '');
  }

  const badScheme = validateHeroImageUrl('javascript:alert(1)');
  assert.equal(badScheme.ok, false);

  const badRelative = validateHeroImageUrl('/uploads/../secret.txt');
  assert.equal(badRelative.ok, false);
});

test('validateTrainerProfileFields enforces clean name, speciality, and experience bounds', () => {
  const valid = validateTrainerProfileFields({
    name: '  Arjun Singh  ',
    speciality: '  Olympic Lifting  ',
    experienceYears: '9',
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.deepEqual(valid.fields, {
      name: 'Arjun Singh',
      speciality: 'Olympic Lifting',
      experienceYears: 9,
    });
  }

  const shortName = validateTrainerProfileFields({ name: 'A' });
  assert.equal(shortName.ok, false);

  const badYears = validateTrainerProfileFields({ name: 'Coach Raj', experienceYears: 99 });
  assert.equal(badYears.ok, false);

  assert.equal(isValidSlotId('coach-rohit'), true);
  assert.equal(isValidSlotId('../bad'), false);
});

test('slot-isolated uploads and appearance persistence preserve hero, gallery, and trainers independently', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'energym-appearance-'));
  const appearancePath = join(dir, 'site-appearance.json');
  const uploadsDir = join(dir, 'uploads');

  try {
    const initial = await readSiteAppearanceFromFile(appearancePath);
    assert.equal(initial.heroImageUrl, '');
    assert.deepEqual(initial.galleryImages, {});
    assert.deepEqual(initial.trainers, {});

    const heroUrl = await saveUploadedHeroImageFile(uploadsDir, 'png', Buffer.from('hero-img'), 1001);
    const galleryUrl1 = await saveUploadedSlotImageFile(
      uploadsDir,
      'gallery-free-weights',
      'jpg',
      Buffer.from('gal-1'),
      1002
    );
    const galleryUrl2 = await saveUploadedSlotImageFile(
      uploadsDir,
      'gallery-free-weights',
      'webp',
      Buffer.from('gal-2'),
      1003
    );
    const trainerUrl = await saveUploadedSlotImageFile(
      uploadsDir,
      'trainer-coach-rohit',
      'jpg',
      Buffer.from('trainer-img'),
      1004
    );

    const files = (await readdir(uploadsDir)).sort();
    assert.deepEqual(files, [
      'gallery-free-weights-1003.webp',
      'hero-1001.png',
      'trainer-coach-rohit-1004.jpg',
    ]);
    assert.equal((await readFile(join(uploadsDir, 'gallery-free-weights-1003.webp'))).toString(), 'gal-2');

    await writeSiteAppearanceSettingsToFile(appearancePath, {
      heroImageUrl: heroUrl,
      galleryImages: { 'free-weights': galleryUrl2 },
      trainers: {
        'coach-rohit': {
          name: 'Kabir Mehta',
          speciality: 'Strength & Rehab',
          experienceYears: 10,
          photoUrl: trainerUrl,
        },
      },
    });

    // Updating hero alone preserves gallery & trainer overrides
    await writeSiteAppearanceToFile(appearancePath, '/uploads/hero-9999.png');
    const loaded = await readSiteAppearanceFromFile(appearancePath);
    assert.equal(loaded.heroImageUrl, '/uploads/hero-9999.png');
    assert.equal(loaded.galleryImages['free-weights'], galleryUrl2);
    assert.equal(loaded.trainers['coach-rohit']?.name, 'Kabir Mehta');
    assert.equal(loaded.trainers['coach-rohit']?.photoUrl, trainerUrl);

    await removeUploadedSlotImageFiles(uploadsDir, 'gallery-free-weights');
    await removeUploadedHeroImageFiles(uploadsDir);
    assert.deepEqual(await readdir(uploadsDir), ['trainer-coach-rohit-1004.jpg']);
    assert.notEqual(galleryUrl1, galleryUrl2);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
