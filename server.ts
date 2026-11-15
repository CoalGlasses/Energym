import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { validateTrialForm } from './src/utils/energymUtils.ts';
import type { TrialFormValues } from './src/utils/energymUtils.ts';
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
} from './src/utils/leadsStore.ts';
import type {
  OwnerAlertSettings,
  TrialLead,
  TrialLeadStatus,
} from './src/utils/leadsStore.ts';
import {
  isValidSlotId,
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
} from './src/utils/heroImageUtils.ts';
import type { SiteAppearanceSettings } from './src/utils/heroImageUtils.ts';

const PORT = Number(process.env.PORT) || 3000;
const LEADS_FILE_PATH = path.resolve(process.cwd(), 'data', 'trial-leads.json');
const SETTINGS_FILE_PATH = path.resolve(process.cwd(), 'data', 'owner-settings.json');
const APPEARANCE_FILE_PATH = path.resolve(process.cwd(), 'data', 'site-appearance.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');
const DEFAULT_OWNER_PASSCODE = 'energym2026';

function getDefaultAlertSettings(): Omit<OwnerAlertSettings, 'updatedAt'> {
  return {
    ownerEmail: '',
    ntfyTopic: '',
    whatsappPhone: '918770964099',
    callmebotApiKey: '',
    customWebhookUrl: '',
  };
}

async function getActiveAlertSettings(): Promise<OwnerAlertSettings> {
  return readOwnerSettingsFromFile(SETTINGS_FILE_PATH, getDefaultAlertSettings());
}

function getNotificationChannelsConfig(settings: OwnerAlertSettings) {
  return {
    emailAlerts: Boolean(settings.ownerEmail && isValidEmailAddress(settings.ownerEmail)),
    ownerEmail: settings.ownerEmail,
    phonePush: Boolean(settings.ntfyTopic),
    ntfyTopic: settings.ntfyTopic,
    phoneWhatsapp: Boolean(settings.whatsappPhone && settings.callmebotApiKey),
    whatsappPhone: settings.whatsappPhone,
  };
}

function resolveRequestOrigin(req: express.Request): string {
  const origin = req.get('origin');
  if (origin) return origin;
  const referer = req.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      // Ignore malformed referer
    }
  }
  const host = req.get('host');
  if (host) {
    return `${req.protocol}://${host}`;
  }
  return process.env.APP_URL || 'http://localhost:3000';
}

async function sendFormSubmitEmail(
  ownerEmail: string,
  subject: string,
  fields: Record<string, string>,
  originHint: string
): Promise<{ ok: boolean; needsActivation?: boolean; detail: string }> {
  const email = ownerEmail.trim().toLowerCase();
  if (!isValidEmailAddress(email)) {
    return {
      ok: false,
      detail: 'Enter a valid owner email address (e.g. gymowner@gmail.com).',
    };
  }

  const endpoint = `https://formsubmit.co/ajax/${encodeURIComponent(email)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: originHint,
      Referer: `${originHint}/`,
    },
    body: JSON.stringify({
      _subject: subject,
      _captcha: 'false',
      _template: 'table',
      ...fields,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as {
    success?: string | boolean;
    message?: string;
  };
  const message = typeof data?.message === 'string' ? data.message : '';

  if (/activat/i.test(message)) {
    return {
      ok: true,
      needsActivation: true,
      detail: `Activation email sent to ${email}! Open that inbox and click "Activate Form" once — after that, all trial bookings will arrive automatically.`,
    };
  }

  const succeeded = data?.success === true || data?.success === 'true';
  if (!response.ok || !succeeded) {
    return {
      ok: false,
      detail: message || `Email delivery returned status ${response.status}.`,
    };
  }

  return {
    ok: true,
    needsActivation: false,
    detail: `Email sent to ${email}! Check your inbox.`,
  };
}

async function sendNtfyPhoneAlert(
  topic: string,
  title: string,
  message: string,
  visitorPhone?: string
): Promise<{ ok: boolean; detail: string }> {
  const safeTopic = sanitizeNtfyTopic(topic);
  if (!safeTopic || safeTopic.length < 4) {
    return {
      ok: false,
      detail: 'Enter a private phone alert channel name (at least 4 characters).',
    };
  }

  const headers: Record<string, string> = {
    Title: title,
    Priority: 'high',
    Tags: 'bell,muscle',
  };

  if (visitorPhone) {
    const dialDigits = normalizeWhatsAppDigits(visitorPhone);
    if (dialDigits) {
      headers.Actions = `view, Call Visitor, tel:+${dialDigits}`;
    }
  }

  const response = await fetch(`https://ntfy.sh/${encodeURIComponent(safeTopic)}`, {
    method: 'POST',
    headers,
    body: message,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    return {
      ok: false,
      detail: errorBody.trim() || `Phone push alert failed (status ${response.status}).`,
    };
  }

  return {
    ok: true,
    detail: `Push notification sent to channel "${safeTopic}".`,
  };
}

async function sendCallMeBotWhatsApp(
  phone: string,
  apiKey: string,
  message: string
): Promise<{ ok: boolean; detail: string }> {
  const targetPhone = normalizeWhatsAppDigits(phone);
  const trimmedKey = apiKey.trim();

  if (!targetPhone || targetPhone.length < 10) {
    return {
      ok: false,
      detail: 'Enter a valid phone number with country code (e.g. 918770964099).',
    };
  }
  if (!trimmedKey) {
    return { ok: false, detail: 'Paste your CallMeBot activation code first.' };
  }

  const endpoint = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
    targetPhone
  )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(trimmedKey)}`;

  const response = await fetch(endpoint);
  const bodyText = await response.text();

  if (!response.ok || /error|invalid|not activated/i.test(bodyText)) {
    return {
      ok: false,
      detail: bodyText.trim() || `WhatsApp alert failed with status ${response.status}.`,
    };
  }

  return { ok: true, detail: `WhatsApp alert sent to +${targetPhone}.` };
}

/**
 * Fires automatic non-blocking notifications to the owner's email, phone push,
 * and/or WhatsApp whenever a visitor books a trial.
 */
async function dispatchOwnerNotifications(lead: TrialLead, originHint: string): Promise<void> {
  const settings = await getActiveAlertSettings();
  const { subject, text } = formatOwnerNotificationPayload(lead);
  const tasks: Promise<unknown>[] = [];

  if (settings.ownerEmail && isValidEmailAddress(settings.ownerEmail)) {
    tasks.push(
      sendFormSubmitEmail(
        settings.ownerEmail,
        subject,
        {
          Name: lead.name,
          Phone: lead.phone,
          'Fitness Goal': lead.goal,
          'Preferred Time': lead.preferredTime,
          'Gym Location': 'Energym · Scheme 78, Vijay Nagar, Indore',
        },
        originHint
      )
    );
  }

  if (settings.ntfyTopic) {
    tasks.push(sendNtfyPhoneAlert(settings.ntfyTopic, subject, text, lead.phone));
  }

  if (settings.whatsappPhone && settings.callmebotApiKey) {
    tasks.push(
      sendCallMeBotWhatsApp(
        settings.whatsappPhone,
        settings.callmebotApiKey,
        `New Energym 1-Day Free Trial\n${text}`
      )
    );
  }

  if (settings.customWebhookUrl) {
    tasks.push(
      fetch(settings.customWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'energym_trial_booked', subject, text, lead }),
      })
    );
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));
  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (
      err &&
      typeof err === 'object' &&
      'type' in err &&
      (err as { type?: string }).type === 'entity.too.large'
    ) {
      return res.status(413).json({
        ok: false,
        error: 'Uploaded image is too large. Please choose an image 8 MB or smaller.',
      });
    }
    return next(err);
  });
  app.use('/uploads', express.static(UPLOADS_DIR));

  function serializeAppearance(appearance: SiteAppearanceSettings) {
    return {
      heroImageUrl: appearance.heroImageUrl || null,
      galleryImages: appearance.galleryImages,
      trainers: appearance.trainers,
      updatedAt: appearance.updatedAt || null,
    };
  }

  // Public endpoint: read custom hero, gallery images, and trainer overrides
  app.get('/api/site-appearance', async (_req, res) => {
    try {
      const appearance = await readSiteAppearanceFromFile(APPEARANCE_FILE_PATH);
      const serialized = serializeAppearance(appearance);
      return res.json({
        ok: true,
        ...serialized,
        appearance: serialized,
      });
    } catch (error) {
      console.error('Failed to read site appearance:', error);
      return res.status(500).json({ ok: false, error: 'Unable to load site appearance.' });
    }
  });

  // Public endpoint: submit a 1-day free trial booking automatically
  app.post('/api/trial-leads', async (req, res) => {
    try {
      const body = req.body ?? {};
      const values: TrialFormValues = {
        name: typeof body.name === 'string' ? body.name : '',
        phone: typeof body.phone === 'string' ? body.phone : '',
        goal: typeof body.goal === 'string' ? body.goal : '',
        preferredTime: typeof body.preferredTime === 'string' ? body.preferredTime : '',
      };

      const errors = validateTrialForm(values);
      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ ok: false, errors });
      }

      const lead = createTrialLeadRecord(values);
      await appendTrialLead(LEADS_FILE_PATH, lead);

      // Deliver to owner's email / phone in background without delaying visitor confirmation
      const originHint = resolveRequestOrigin(req);
      void dispatchOwnerNotifications(lead, originHint);

      return res.status(201).json({ ok: true, lead });
    } catch (error) {
      console.error('Failed to save trial lead:', error);
      return res.status(500).json({ ok: false, error: 'Unable to save booking right now.' });
    }
  });

  // Owner auth verification
  app.post('/api/owner/login', async (req, res) => {
    const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode : '';
    if (passcode !== DEFAULT_OWNER_PASSCODE) {
      return res.status(401).json({ ok: false, error: 'Incorrect owner passcode.' });
    }
    const settings = await getActiveAlertSettings();
    return res.json({ ok: true, channels: getNotificationChannelsConfig(settings) });
  });

  // Middleware protecting owner lead reads/updates and alert settings
  const requireOwnerAuth: express.RequestHandler = (req, res, next) => {
    const provided = req.header('x-owner-passcode') || '';
    if (provided !== DEFAULT_OWNER_PASSCODE) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    return next();
  };

  app.get('/api/trial-leads', requireOwnerAuth, async (_req, res) => {
    try {
      const [leads, settings] = await Promise.all([
        readLeadsFromFile(LEADS_FILE_PATH),
        getActiveAlertSettings(),
      ]);
      return res.json({
        ok: true,
        leads,
        channels: getNotificationChannelsConfig(settings),
      });
    } catch (error) {
      console.error('Failed to read trial leads:', error);
      return res.status(500).json({ ok: false, error: 'Unable to load trial bookings.' });
    }
  });

  app.patch('/api/trial-leads/:id', requireOwnerAuth, async (req, res) => {
    const status = req.body?.status as TrialLeadStatus | undefined;
    if (status !== 'new' && status !== 'contacted' && status !== 'visited') {
      return res.status(400).json({ ok: false, error: 'Invalid status value.' });
    }
    const updated = await updateLeadStatusInFile(LEADS_FILE_PATH, req.params.id, status);
    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Booking not found.' });
    }
    return res.json({ ok: true, lead: updated });
  });

  app.delete('/api/trial-leads/:id', requireOwnerAuth, async (req, res) => {
    const deleted = await deleteLeadFromFile(LEADS_FILE_PATH, req.params.id);
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Booking not found.' });
    }
    return res.json({ ok: true });
  });

  app.get('/api/owner/alert-settings', requireOwnerAuth, async (_req, res) => {
    try {
      const settings = await getActiveAlertSettings();
      return res.json({
        ok: true,
        settings,
        channels: getNotificationChannelsConfig(settings),
      });
    } catch (error) {
      console.error('Failed to load alert settings:', error);
      return res.status(500).json({ ok: false, error: 'Unable to load alert settings.' });
    }
  });

  app.put('/api/owner/alert-settings', requireOwnerAuth, async (req, res) => {
    try {
      const body = req.body ?? {};
      const ownerEmail =
        typeof body.ownerEmail === 'string' ? body.ownerEmail.trim().toLowerCase() : '';
      const ntfyTopic = sanitizeNtfyTopic(
        typeof body.ntfyTopic === 'string' ? body.ntfyTopic : ''
      );
      const whatsappPhone = normalizeWhatsAppDigits(
        typeof body.whatsappPhone === 'string' ? body.whatsappPhone : '918770964099'
      );

      if (ownerEmail && !isValidEmailAddress(ownerEmail)) {
        return res.status(400).json({
          ok: false,
          error: 'Enter a valid owner email address (e.g. gymowner@gmail.com).',
        });
      }

      if (typeof body.ntfyTopic === 'string' && body.ntfyTopic.trim() && ntfyTopic.length < 4) {
        return res.status(400).json({
          ok: false,
          error: 'Phone alert channel name must be at least 4 letters/numbers.',
        });
      }

      if (whatsappPhone && whatsappPhone.length < 10) {
        return res.status(400).json({
          ok: false,
          error: 'Enter a valid 10-digit Indian mobile number or international WhatsApp number.',
        });
      }

      const saved = await writeOwnerSettingsToFile(SETTINGS_FILE_PATH, {
        ownerEmail,
        ntfyTopic,
        whatsappPhone: whatsappPhone || '918770964099',
        callmebotApiKey: typeof body.callmebotApiKey === 'string' ? body.callmebotApiKey : '',
        customWebhookUrl:
          typeof body.customWebhookUrl === 'string' ? body.customWebhookUrl : '',
      });

      return res.json({
        ok: true,
        settings: saved,
        channels: getNotificationChannelsConfig(saved),
      });
    } catch (error) {
      console.error('Failed to save alert settings:', error);
      return res.status(500).json({ ok: false, error: 'Unable to save alert settings.' });
    }
  });

  app.post('/api/owner/test-alert', requireOwnerAuth, async (req, res) => {
    try {
      const current = await getActiveAlertSettings();
      const body = req.body ?? {};
      const mode =
        body.mode === 'email'
          ? 'email'
          : body.mode === 'whatsapp'
            ? 'whatsapp'
            : 'ntfy';

      if (mode === 'email') {
        const email =
          typeof body.ownerEmail === 'string' && body.ownerEmail.trim()
            ? body.ownerEmail
            : current.ownerEmail;
        const originHint = resolveRequestOrigin(req);
        const result = await sendFormSubmitEmail(
          email,
          'Energym Email Alerts Connected — Test',
          {
            Message:
              'This is a test from your Energym website. New 1-day free trial bookings will arrive here automatically.',
            Location: 'Energym · Scheme 78, Vijay Nagar, Indore',
          },
          originHint
        );
        if (!result.ok) {
          return res.status(400).json({ ok: false, error: result.detail });
        }
        return res.json({
          ok: true,
          needsActivation: Boolean(result.needsActivation),
          message: result.detail,
        });
      }

      if (mode === 'whatsapp') {
        const phone =
          typeof body.whatsappPhone === 'string' && body.whatsappPhone.trim()
            ? body.whatsappPhone
            : current.whatsappPhone;
        const apiKey =
          typeof body.callmebotApiKey === 'string' && body.callmebotApiKey.trim()
            ? body.callmebotApiKey
            : current.callmebotApiKey;

        const testText = [
          'Energym Test Alert',
          'Phone WhatsApp notifications are connected!',
          'New 1-day trial bookings will arrive here automatically.',
        ].join('\n');

        const result = await sendCallMeBotWhatsApp(phone, apiKey, testText);
        if (!result.ok) {
          return res.status(400).json({ ok: false, error: result.detail });
        }
        return res.json({ ok: true, message: result.detail });
      }

      const topic =
        typeof body.ntfyTopic === 'string' && body.ntfyTopic.trim()
          ? body.ntfyTopic
          : current.ntfyTopic;

      const result = await sendNtfyPhoneAlert(
        topic,
        'Energym Test Alert',
        'Phone alerts are connected! New 1-day trial bookings will ring here immediately.',
        '918770964099'
      );
      if (!result.ok) {
        return res.status(400).json({ ok: false, error: result.detail });
      }
      return res.json({ ok: true, message: result.detail });
    } catch (error) {
      console.error('Failed to send test alert:', error);
      return res.status(500).json({
        ok: false,
        error: 'Could not reach the notification service right now. Please try again.',
      });
    }
  });

  // Update or reset the custom hero background image
  app.put('/api/owner/hero-image', requireOwnerAuth, async (req, res) => {
    try {
      const body = req.body ?? {};
      const imageDataUrl = typeof body.imageDataUrl === 'string' ? body.imageDataUrl.trim() : '';
      const imageUrlInput = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';

      if (body.reset === true || (!imageDataUrl && !imageUrlInput)) {
        await removeUploadedHeroImageFiles(UPLOADS_DIR);
        const saved = await writeSiteAppearanceToFile(APPEARANCE_FILE_PATH, '');
        const serialized = serializeAppearance(saved);
        return res.json({
          ok: true,
          heroImageUrl: null,
          updatedAt: saved.updatedAt,
          appearance: serialized,
        });
      }

      if (imageDataUrl) {
        const parsed = parseImageDataUrl(imageDataUrl);
        if (!parsed.ok) {
          return res.status(400).json({ ok: false, error: parsed.error });
        }
        const localUrl = await saveUploadedHeroImageFile(
          UPLOADS_DIR,
          parsed.extension,
          parsed.buffer
        );
        const saved = await writeSiteAppearanceToFile(APPEARANCE_FILE_PATH, localUrl);
        const serialized = serializeAppearance(saved);
        return res.json({
          ok: true,
          heroImageUrl: saved.heroImageUrl,
          updatedAt: saved.updatedAt,
          appearance: serialized,
        });
      }

      const validated = validateHeroImageUrl(imageUrlInput);
      if (!validated.ok) {
        return res.status(400).json({ ok: false, error: validated.error });
      }

      if (!validated.url.startsWith('/uploads/')) {
        await removeUploadedHeroImageFiles(UPLOADS_DIR);
      }
      const saved = await writeSiteAppearanceToFile(APPEARANCE_FILE_PATH, validated.url);
      const serialized = serializeAppearance(saved);
      return res.json({
        ok: true,
        heroImageUrl: saved.heroImageUrl || null,
        updatedAt: saved.updatedAt,
        appearance: serialized,
      });
    } catch (error) {
      console.error('Failed to update hero image:', error);
      return res.status(500).json({ ok: false, error: 'Unable to update hero image right now.' });
    }
  });

  app.delete('/api/owner/hero-image', requireOwnerAuth, async (_req, res) => {
    try {
      await removeUploadedHeroImageFiles(UPLOADS_DIR);
      const saved = await writeSiteAppearanceToFile(APPEARANCE_FILE_PATH, '');
      const serialized = serializeAppearance(saved);
      return res.json({
        ok: true,
        heroImageUrl: null,
        updatedAt: saved.updatedAt,
        appearance: serialized,
      });
    } catch (error) {
      console.error('Failed to reset hero image:', error);
      return res.status(500).json({ ok: false, error: 'Unable to reset hero image right now.' });
    }
  });

  // Update or reset an Inside Energym gallery image slot
  app.put('/api/owner/gallery-image/:id', requireOwnerAuth, async (req, res) => {
    try {
      const slotId = req.params.id;
      if (!isValidSlotId(slotId)) {
        return res.status(400).json({ ok: false, error: 'Invalid gallery photo ID.' });
      }

      const body = req.body ?? {};
      const imageDataUrl = typeof body.imageDataUrl === 'string' ? body.imageDataUrl.trim() : '';
      const imageUrlInput = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
      const current = await readSiteAppearanceFromFile(APPEARANCE_FILE_PATH);
      const nextGallery = { ...current.galleryImages };
      const slotKey = `gallery-${slotId}`;

      if (body.reset === true || (!imageDataUrl && !imageUrlInput)) {
        await removeUploadedSlotImageFiles(UPLOADS_DIR, slotKey);
        delete nextGallery[slotId];
      } else if (imageDataUrl) {
        const parsed = parseImageDataUrl(imageDataUrl);
        if (!parsed.ok) {
          return res.status(400).json({ ok: false, error: parsed.error });
        }
        nextGallery[slotId] = await saveUploadedSlotImageFile(
          UPLOADS_DIR,
          slotKey,
          parsed.extension,
          parsed.buffer
        );
      } else {
        const validated = validateHeroImageUrl(imageUrlInput);
        if (!validated.ok) {
          return res.status(400).json({ ok: false, error: validated.error });
        }
        if (!validated.url.startsWith('/uploads/')) {
          await removeUploadedSlotImageFiles(UPLOADS_DIR, slotKey);
        }
        if (validated.url) {
          nextGallery[slotId] = validated.url;
        } else {
          delete nextGallery[slotId];
        }
      }

      const saved = await writeSiteAppearanceSettingsToFile(APPEARANCE_FILE_PATH, {
        ...current,
        galleryImages: nextGallery,
      });
      return res.json({
        ok: true,
        appearance: serializeAppearance(saved),
      });
    } catch (error) {
      console.error('Failed to update gallery image:', error);
      return res.status(500).json({ ok: false, error: 'Unable to update gallery photo right now.' });
    }
  });

  app.delete('/api/owner/gallery-image/:id', requireOwnerAuth, async (req, res) => {
    try {
      const slotId = req.params.id;
      if (!isValidSlotId(slotId)) {
        return res.status(400).json({ ok: false, error: 'Invalid gallery photo ID.' });
      }
      await removeUploadedSlotImageFiles(UPLOADS_DIR, `gallery-${slotId}`);
      const current = await readSiteAppearanceFromFile(APPEARANCE_FILE_PATH);
      const nextGallery = { ...current.galleryImages };
      delete nextGallery[slotId];

      const saved = await writeSiteAppearanceSettingsToFile(APPEARANCE_FILE_PATH, {
        ...current,
        galleryImages: nextGallery,
      });
      return res.json({
        ok: true,
        appearance: serializeAppearance(saved),
      });
    } catch (error) {
      console.error('Failed to reset gallery image:', error);
      return res.status(500).json({ ok: false, error: 'Unable to reset gallery photo right now.' });
    }
  });

  // Update or reset a trainer's photo and/or name, speciality, and experience
  app.put('/api/owner/trainer/:id', requireOwnerAuth, async (req, res) => {
    try {
      const trainerId = req.params.id;
      if (!isValidSlotId(trainerId)) {
        return res.status(400).json({ ok: false, error: 'Invalid trainer ID.' });
      }

      const body = req.body ?? {};
      const current = await readSiteAppearanceFromFile(APPEARANCE_FILE_PATH);
      const existingEntry = { ...(current.trainers[trainerId] ?? {}) };
      const slotKey = `trainer-${trainerId}`;

      const validatedProfile = validateTrainerProfileFields({
        name: body.name,
        speciality: body.speciality,
        experienceYears: body.experienceYears,
      });
      if (!validatedProfile.ok) {
        return res.status(400).json({ ok: false, error: validatedProfile.error });
      }

      if (typeof body.name === 'string') {
        if (validatedProfile.fields.name) {
          existingEntry.name = validatedProfile.fields.name;
        } else {
          delete existingEntry.name;
        }
      }
      if (typeof body.speciality === 'string') {
        if (validatedProfile.fields.speciality) {
          existingEntry.speciality = validatedProfile.fields.speciality;
        } else {
          delete existingEntry.speciality;
        }
      }
      if (body.experienceYears !== undefined) {
        if (typeof validatedProfile.fields.experienceYears === 'number') {
          existingEntry.experienceYears = validatedProfile.fields.experienceYears;
        } else {
          delete existingEntry.experienceYears;
        }
      }

      const imageDataUrl = typeof body.imageDataUrl === 'string' ? body.imageDataUrl.trim() : '';
      const imageUrlInput = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';

      if (body.resetPhoto === true) {
        await removeUploadedSlotImageFiles(UPLOADS_DIR, slotKey);
        delete existingEntry.photoUrl;
      } else if (imageDataUrl) {
        const parsed = parseImageDataUrl(imageDataUrl);
        if (!parsed.ok) {
          return res.status(400).json({ ok: false, error: parsed.error });
        }
        existingEntry.photoUrl = await saveUploadedSlotImageFile(
          UPLOADS_DIR,
          slotKey,
          parsed.extension,
          parsed.buffer
        );
      } else if (typeof body.imageUrl === 'string') {
        const validatedUrl = validateHeroImageUrl(imageUrlInput);
        if (!validatedUrl.ok) {
          return res.status(400).json({ ok: false, error: validatedUrl.error });
        }
        if (validatedUrl.url) {
          if (!validatedUrl.url.startsWith('/uploads/')) {
            await removeUploadedSlotImageFiles(UPLOADS_DIR, slotKey);
          }
          existingEntry.photoUrl = validatedUrl.url;
        }
      }

      const nextTrainers = { ...current.trainers };
      if (Object.keys(existingEntry).length > 0) {
        nextTrainers[trainerId] = existingEntry;
      } else {
        delete nextTrainers[trainerId];
      }

      const saved = await writeSiteAppearanceSettingsToFile(APPEARANCE_FILE_PATH, {
        ...current,
        trainers: nextTrainers,
      });
      return res.json({
        ok: true,
        appearance: serializeAppearance(saved),
      });
    } catch (error) {
      console.error('Failed to update trainer:', error);
      return res.status(500).json({ ok: false, error: 'Unable to update trainer right now.' });
    }
  });

  app.delete('/api/owner/trainer/:id', requireOwnerAuth, async (req, res) => {
    try {
      const trainerId = req.params.id;
      if (!isValidSlotId(trainerId)) {
        return res.status(400).json({ ok: false, error: 'Invalid trainer ID.' });
      }
      await removeUploadedSlotImageFiles(UPLOADS_DIR, `trainer-${trainerId}`);
      const current = await readSiteAppearanceFromFile(APPEARANCE_FILE_PATH);
      const nextTrainers = { ...current.trainers };
      delete nextTrainers[trainerId];

      const saved = await writeSiteAppearanceSettingsToFile(APPEARANCE_FILE_PATH, {
        ...current,
        trainers: nextTrainers,
      });
      return res.json({
        ok: true,
        appearance: serializeAppearance(saved),
      });
    } catch (error) {
      console.error('Failed to reset trainer:', error);
      return res.status(500).json({ ok: false, error: 'Unable to reset trainer right now.' });
    }
  });

  const distPath = path.resolve(process.cwd(), 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distPath, 'index.html'));

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Energym server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
