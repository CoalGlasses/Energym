import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { normalizeIndianPhone } from './energymUtils.ts';
import type { TrialFormValues } from './energymUtils.ts';

export type TrialLeadStatus = 'new' | 'contacted' | 'visited';

export interface TrialLead {
  id: string;
  name: string;
  phone: string;
  goal: string;
  preferredTime: string;
  status: TrialLeadStatus;
  createdAt: string;
}

export interface OwnerAlertSettings {
  ownerEmail: string;
  ntfyTopic: string;
  whatsappPhone: string;
  callmebotApiKey: string;
  customWebhookUrl: string;
  updatedAt: string;
}

/**
 * Validates and normalizes an email address string.
 */
export function isValidEmailAddress(input: string): boolean {
  const trimmed = input.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

/**
 * Sanitizes an ntfy.sh channel topic name into safe URL characters.
 */
export function sanitizeNtfyTopic(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/**
 * Normalizes a WhatsApp destination number into international digits without '+'.
 * Defaults 10-digit Indian mobile numbers to '91' prefix.
 */
export function normalizeWhatsAppDigits(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Builds a normalized TrialLead record ready for persistence and notification.
 */
export function createTrialLeadRecord(
  values: TrialFormValues,
  nowIso = new Date().toISOString()
): TrialLead {
  const normalizedPhone = normalizeIndianPhone(values.phone) || values.phone.trim();
  return {
    id: randomUUID(),
    name: values.name.trim(),
    phone: normalizedPhone,
    goal: values.goal.trim(),
    preferredTime: values.preferredTime.trim(),
    status: 'new',
    createdAt: nowIso,
  };
}

/**
 * Formats an automatic notification payload for Email, Phone Push, WhatsApp, or Webhook delivery.
 */
export function formatOwnerNotificationPayload(lead: TrialLead) {
  const subject = `New 1-Day Free Trial: ${lead.name} (${lead.phone})`;
  const text = [
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Goal: ${lead.goal}`,
    `Preferred Time: ${lead.preferredTime}`,
  ].join('\n');

  return { subject, text, lead };
}

export async function readLeadsFromFile(filePath: string): Promise<TrialLead[]> {
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TrialLead[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export async function writeLeadsToFile(filePath: string, leads: TrialLead[]): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(leads, null, 2), 'utf8');
}

export async function appendTrialLead(filePath: string, lead: TrialLead): Promise<TrialLead[]> {
  const existing = await readLeadsFromFile(filePath);
  const updated = [lead, ...existing];
  await writeLeadsToFile(filePath, updated);
  return updated;
}

export async function updateLeadStatusInFile(
  filePath: string,
  id: string,
  status: TrialLeadStatus
): Promise<TrialLead | null> {
  const existing = await readLeadsFromFile(filePath);
  const index = existing.findIndex((lead) => lead.id === id);
  if (index === -1) {
    return null;
  }
  const updatedLead: TrialLead = { ...existing[index], status };
  existing[index] = updatedLead;
  await writeLeadsToFile(filePath, existing);
  return updatedLead;
}

export async function deleteLeadFromFile(filePath: string, id: string): Promise<boolean> {
  const existing = await readLeadsFromFile(filePath);
  const filtered = existing.filter((lead) => lead.id !== id);
  if (filtered.length === existing.length) {
    return false;
  }
  await writeLeadsToFile(filePath, filtered);
  return true;
}

export async function readOwnerSettingsFromFile(
  filePath: string,
  defaults: Omit<OwnerAlertSettings, 'updatedAt'>
): Promise<OwnerAlertSettings> {
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<OwnerAlertSettings>;
    return {
      ownerEmail:
        typeof parsed.ownerEmail === 'string'
          ? parsed.ownerEmail.trim().toLowerCase()
          : defaults.ownerEmail.trim().toLowerCase(),
      ntfyTopic: sanitizeNtfyTopic(
        typeof parsed.ntfyTopic === 'string' ? parsed.ntfyTopic : defaults.ntfyTopic
      ),
      whatsappPhone: normalizeWhatsAppDigits(
        typeof parsed.whatsappPhone === 'string' && parsed.whatsappPhone.trim()
          ? parsed.whatsappPhone
          : defaults.whatsappPhone
      ),
      callmebotApiKey:
        typeof parsed.callmebotApiKey === 'string'
          ? parsed.callmebotApiKey.trim()
          : defaults.callmebotApiKey,
      customWebhookUrl:
        typeof parsed.customWebhookUrl === 'string'
          ? parsed.customWebhookUrl.trim()
          : defaults.customWebhookUrl,
      updatedAt:
        typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        ownerEmail: defaults.ownerEmail.trim().toLowerCase(),
        ntfyTopic: sanitizeNtfyTopic(defaults.ntfyTopic),
        whatsappPhone: normalizeWhatsAppDigits(defaults.whatsappPhone),
        callmebotApiKey: defaults.callmebotApiKey,
        customWebhookUrl: defaults.customWebhookUrl,
        updatedAt: '',
      };
    }
    throw error;
  }
}

export async function writeOwnerSettingsToFile(
  filePath: string,
  settings: Omit<OwnerAlertSettings, 'updatedAt'>
): Promise<OwnerAlertSettings> {
  const normalized: OwnerAlertSettings = {
    ownerEmail: settings.ownerEmail.trim().toLowerCase(),
    ntfyTopic: sanitizeNtfyTopic(settings.ntfyTopic),
    whatsappPhone: normalizeWhatsAppDigits(settings.whatsappPhone),
    callmebotApiKey: settings.callmebotApiKey.trim(),
    customWebhookUrl: settings.customWebhookUrl.trim(),
    updatedAt: new Date().toISOString(),
  };
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}
