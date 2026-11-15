import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appendTrialLead,
  createTrialLeadRecord,
  deleteLeadFromFile,
  formatOwnerNotificationPayload,
  isValidEmailAddress,
  normalizeWhatsAppDigits,
  readLeadsFromFile,
  readOwnerSettingsFromFile,
  sanitizeNtfyTopic,
  updateLeadStatusInFile,
  writeOwnerSettingsToFile,
} from './leadsStore.ts';

test('isValidEmailAddress validates standard owner emails cleanly', () => {
  assert.equal(isValidEmailAddress('owner@energym.in'), true);
  assert.equal(isValidEmailAddress('  Owner.Indore@gmail.com  '), true);
  assert.equal(isValidEmailAddress('not-an-email'), false);
  assert.equal(isValidEmailAddress(''), false);
});

test('sanitizeNtfyTopic cleans spaces and unsafe characters cleanly', () => {
  assert.equal(sanitizeNtfyTopic('  Energym Vijay Nagar!  '), 'energym-vijay-nagar');
  assert.equal(sanitizeNtfyTopic('energym_leads_8770964099'), 'energym_leads_8770964099');
});

test('normalizeWhatsAppDigits converts Indian numbers into international digits', () => {
  assert.equal(normalizeWhatsAppDigits('08770964099'), '918770964099');
  assert.equal(normalizeWhatsAppDigits('+91 87709 64099'), '918770964099');
  assert.equal(normalizeWhatsAppDigits('8770964099'), '918770964099');
});

test('createTrialLeadRecord normalizes Indian phone and trims fields', () => {
  const lead = createTrialLeadRecord(
    {
      name: '  Aarav Joshi  ',
      phone: '+91 98765 43210',
      goal: 'Muscle Gain & Strength',
      preferredTime: 'Morning (5:30 AM – 10:00 AM)',
    },
    '2026-11-14T04:00:00.000Z'
  );

  assert.equal(lead.name, 'Aarav Joshi');
  assert.equal(lead.phone, '9876543210');
  assert.equal(lead.status, 'new');
  assert.equal(lead.createdAt, '2026-11-14T04:00:00.000Z');
  assert.ok(lead.id.length > 8);
});

test('formatOwnerNotificationPayload includes lead contact details', () => {
  const lead = createTrialLeadRecord(
    {
      name: 'Priya Mehta',
      phone: '9988776655',
      goal: 'Fat Loss & Conditioning',
      preferredTime: 'Evening (4:00 PM – 8:00 PM)',
    },
    '2026-11-14T05:00:00.000Z'
  );

  const payload = formatOwnerNotificationPayload(lead);
  assert.match(payload.subject, /Priya Mehta/);
  assert.match(payload.text, /9988776655/);
  assert.match(payload.text, /Fat Loss & Conditioning/);
});

test('file persistence supports append, read, status update, and delete', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'energym-leads-'));
  const filePath = join(dir, 'trial-leads.json');

  try {
    const initial = await readLeadsFromFile(filePath);
    assert.deepEqual(initial, []);

    const lead = createTrialLeadRecord({
      name: 'Karan Verma',
      phone: '09876543210',
      goal: 'General Fitness & Mobility',
      preferredTime: 'Midday (10:00 AM – 4:00 PM)',
    });

    await appendTrialLead(filePath, lead);
    const loaded = await readLeadsFromFile(filePath);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].phone, '9876543210');

    const updated = await updateLeadStatusInFile(filePath, lead.id, 'contacted');
    assert.equal(updated?.status, 'contacted');

    const removed = await deleteLeadFromFile(filePath, lead.id);
    assert.equal(removed, true);
    assert.deepEqual(await readLeadsFromFile(filePath), []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('owner alert settings file read falls back to defaults and persists email, phone, and ntfyTopic', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'energym-settings-'));
  const filePath = join(dir, 'owner-settings.json');

  try {
    const initial = await readOwnerSettingsFromFile(filePath, {
      ownerEmail: '',
      ntfyTopic: '',
      whatsappPhone: '08770964099',
      callmebotApiKey: '',
      customWebhookUrl: '',
    });
    assert.equal(initial.ownerEmail, '');
    assert.equal(initial.ntfyTopic, '');
    assert.equal(initial.whatsappPhone, '918770964099');
    assert.equal(initial.callmebotApiKey, '');

    await writeOwnerSettingsToFile(filePath, {
      ownerEmail: '  Owner@Energym.in ',
      ntfyTopic: ' Energym Leads 87709 ',
      whatsappPhone: '+91 87709 64099',
      callmebotApiKey: ' 123456 ',
      customWebhookUrl: '',
    });

    const reloaded = await readOwnerSettingsFromFile(filePath, {
      ownerEmail: '',
      ntfyTopic: '',
      whatsappPhone: '08770964099',
      callmebotApiKey: '',
      customWebhookUrl: '',
    });
    assert.equal(reloaded.ownerEmail, 'owner@energym.in');
    assert.equal(reloaded.ntfyTopic, 'energym-leads-87709');
    assert.equal(reloaded.whatsappPhone, '918770964099');
    assert.equal(reloaded.callmebotApiKey, '123456');
    assert.ok(reloaded.updatedAt.length > 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
