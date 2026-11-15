import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppUrl,
  formatContactWhatsAppMessage,
  formatCurrencyINR,
  formatMembershipWhatsAppMessage,
  formatTrialWhatsAppMessage,
  getNextGalleryIndex,
  normalizeIndianPhone,
  splitBrandTitleParts,
  validateContactForm,
  validateTrialForm,
} from './energymUtils';

test('normalizeIndianPhone handles spaces, +91, and leading zero', () => {
  assert.equal(normalizeIndianPhone('8770964099'), '8770964099');
  assert.equal(normalizeIndianPhone('08770964099'), '8770964099');
  assert.equal(normalizeIndianPhone('+91 87709-64099'), '8770964099');
  assert.equal(normalizeIndianPhone('12345'), '');
  assert.equal(normalizeIndianPhone('1234567890'), '');
});

test('validateTrialForm catches invalid fields and passes valid data', () => {
  const invalid = validateTrialForm({
    name: 'A',
    phone: '999',
    goal: '',
    preferredTime: '',
  });
  assert.ok(invalid.name);
  assert.ok(invalid.phone);
  assert.ok(invalid.goal);
  assert.ok(invalid.preferredTime);

  const valid = validateTrialForm({
    name: 'Aarav Joshi',
    phone: '+91 98260 12345',
    goal: 'Muscle Gain & Strength',
    preferredTime: 'Morning (6:00 AM – 10:00 AM)',
  });
  assert.deepEqual(valid, {});
});

test('validateContactForm enforces name, valid phone, and message length', () => {
  const invalid = validateContactForm({
    name: '',
    phone: 'abc',
    message: 'Hi',
  });
  assert.ok(invalid.name);
  assert.ok(invalid.phone);
  assert.ok(invalid.message);

  const valid = validateContactForm({
    name: 'Neha Kulkarni',
    phone: '09826012345',
    message: 'Looking for evening personal training slots.',
  });
  assert.deepEqual(valid, {});
});

test('WhatsApp message and URL formatting preserve details accurately', () => {
  const msg = formatTrialWhatsAppMessage({
    name: 'Rohan Mehta',
    phone: '08770964099',
    goal: 'Fat Loss',
    preferredTime: 'Evening (5:00 PM – 9:00 PM)',
  });
  assert.match(msg, /Rohan Mehta/);
  assert.match(msg, /8770964099/);
  assert.match(msg, /Fat Loss/);

  const url = buildWhatsAppUrl('918770964099', msg);
  assert.ok(url.startsWith('https://wa.me/918770964099?text='));
  assert.ok(decodeURIComponent(url).includes('Rohan Mehta'));

  const planMsg = formatMembershipWhatsAppMessage('Quarterly', '₹4,999', '3 Months');
  assert.match(planMsg, /Quarterly/);
  assert.match(planMsg, /₹4,999/);

  const contactMsg = formatContactWhatsAppMessage({
    name: 'Kabir Sen',
    phone: '9876543210',
    message: 'Do you have morning trainer availability?',
  });
  assert.match(contactMsg, /Kabir Sen/);
  assert.match(contactMsg, /morning trainer availability/);
});

test('formatCurrencyINR formats Indian comma grouping', () => {
  assert.equal(formatCurrencyINR(1999), '₹1,999');
  assert.equal(formatCurrencyINR(14999), '₹14,999');
});

test('getNextGalleryIndex wraps cleanly in both directions', () => {
  assert.equal(getNextGalleryIndex(0, 'prev', 6), 5);
  assert.equal(getNextGalleryIndex(5, 'next', 6), 0);
  assert.equal(getNextGalleryIndex(2, 'next', 6), 3);
  assert.equal(getNextGalleryIndex(2, 'prev', 6), 1);
  assert.equal(getNextGalleryIndex(0, 'next', 0), 0);
});

test('splitBrandTitleParts isolates Energym brand tokens inside headings', () => {
  assert.deepEqual(splitBrandTitleParts('Try Energym Free for 1 Day'), [
    { text: 'Try ', isBrand: false },
    { text: 'Energym', isBrand: true },
    { text: ' Free for 1 Day', isBrand: false },
  ]);
  assert.deepEqual(splitBrandTitleParts('Inside Energym'), [
    { text: 'Inside ', isBrand: false },
    { text: 'Energym', isBrand: true },
  ]);
});
