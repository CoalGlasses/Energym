import { useEffect, useState } from 'react';
import { ENERGYM_CONFIG } from '../config/energymConfig';
import type { GalleryPhoto, TrainerProfile } from '../config/energymConfig';

export interface ClientTrainerOverride {
  name?: string;
  speciality?: string;
  experienceYears?: number;
  photoUrl?: string;
}

export interface SiteAppearanceState {
  heroImageUrl: string | null;
  galleryImages: Record<string, string>;
  trainers: Record<string, ClientTrainerOverride>;
  updatedAt: string | null;
}

export interface ResolvedGalleryPhoto extends GalleryPhoto {
  isCustomImage: boolean;
  customImageUrl: string | null;
}

export interface ResolvedTrainerProfile extends TrainerProfile {
  isCustomPhoto: boolean;
  isCustomProfile: boolean;
  customPhotoUrl: string | null;
}

const EMPTY_APPEARANCE: SiteAppearanceState = {
  heroImageUrl: null,
  galleryImages: {},
  trainers: {},
  updatedAt: null,
};

let cachedAppearance: SiteAppearanceState = EMPTY_APPEARANCE;
let hasFetchedAppearance = false;
const listeners = new Set<(state: SiteAppearanceState) => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener(cachedAppearance);
  }
}

function normalizeAppearancePayload(raw: unknown): SiteAppearanceState {
  if (!raw || typeof raw !== 'object') return EMPTY_APPEARANCE;
  const obj = raw as Record<string, unknown>;
  const source =
    obj.appearance && typeof obj.appearance === 'object'
      ? (obj.appearance as Record<string, unknown>)
      : obj;

  const heroImageUrl =
    typeof source.heroImageUrl === 'string' && source.heroImageUrl.trim()
      ? source.heroImageUrl.trim()
      : null;

  const galleryImages: Record<string, string> = {};
  if (source.galleryImages && typeof source.galleryImages === 'object') {
    for (const [id, url] of Object.entries(source.galleryImages as Record<string, unknown>)) {
      if (typeof url === 'string' && url.trim()) {
        galleryImages[id] = url.trim();
      }
    }
  }

  const trainers: Record<string, ClientTrainerOverride> = {};
  if (source.trainers && typeof source.trainers === 'object') {
    for (const [id, entry] of Object.entries(source.trainers as Record<string, unknown>)) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Record<string, unknown>;
      const clean: ClientTrainerOverride = {};
      if (typeof item.name === 'string' && item.name.trim()) clean.name = item.name.trim();
      if (typeof item.speciality === 'string' && item.speciality.trim()) {
        clean.speciality = item.speciality.trim();
      }
      if (typeof item.experienceYears === 'number' && Number.isFinite(item.experienceYears)) {
        clean.experienceYears = item.experienceYears;
      }
      if (typeof item.photoUrl === 'string' && item.photoUrl.trim()) {
        clean.photoUrl = item.photoUrl.trim();
      }
      if (Object.keys(clean).length > 0) {
        trainers[id] = clean;
      }
    }
  }

  return {
    heroImageUrl,
    galleryImages,
    trainers,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : null,
  };
}

export function setActiveSiteAppearance(raw: unknown) {
  cachedAppearance = normalizeAppearancePayload(raw);
  hasFetchedAppearance = true;
  notifyListeners();
}

export function setActiveCustomHeroUrl(nextUrl: string | null) {
  cachedAppearance = {
    ...cachedAppearance,
    heroImageUrl: nextUrl && nextUrl.trim() ? nextUrl.trim() : null,
  };
  hasFetchedAppearance = true;
  notifyListeners();
}

export async function refreshSiteAppearance(): Promise<SiteAppearanceState> {
  try {
    const response = await fetch('/api/site-appearance');
    if (!response.ok) return cachedAppearance;
    const data = await response.json().catch(() => ({}));
    if (data && typeof data === 'object' && (data as { ok?: boolean }).ok) {
      setActiveSiteAppearance(data);
    }
  } catch {
    // Keep bundled defaults if offline
  }
  return cachedAppearance;
}

export function useSiteAppearance() {
  const [state, setState] = useState<SiteAppearanceState>(cachedAppearance);

  useEffect(() => {
    listeners.add(setState);
    if (!hasFetchedAppearance) {
      void refreshSiteAppearance();
    } else {
      setState(cachedAppearance);
    }
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const galleryPhotos: ResolvedGalleryPhoto[] = ENERGYM_CONFIG.gallery.map((photo) => {
    const customUrl = state.galleryImages[photo.id] || null;
    return {
      ...photo,
      src: customUrl || photo.src,
      isCustomImage: Boolean(customUrl),
      customImageUrl: customUrl,
    };
  });

  const trainers: ResolvedTrainerProfile[] = ENERGYM_CONFIG.trainers.map((trainer) => {
    const override = state.trainers[trainer.id];
    const resolvedName = override?.name || trainer.name;
    const resolvedSpeciality = override?.speciality || trainer.speciality;
    const resolvedExperience =
      typeof override?.experienceYears === 'number'
        ? override.experienceYears
        : trainer.experienceYears;
    const customPhotoUrl = override?.photoUrl || null;
    return {
      ...trainer,
      name: resolvedName,
      speciality: resolvedSpeciality,
      experienceYears: resolvedExperience,
      photoSrc: customPhotoUrl || trainer.photoSrc,
      photoAlt: override
        ? `Coach ${resolvedName}, ${resolvedSpeciality} trainer at Energym`
        : trainer.photoAlt,
      isCustomPhoto: Boolean(customPhotoUrl),
      isCustomProfile: Boolean(
        override &&
          (override.name ||
            override.speciality ||
            typeof override.experienceYears === 'number' ||
            override.photoUrl)
      ),
      customPhotoUrl,
    };
  });

  return {
    appearance: state,
    heroImageSrc: state.heroImageUrl || ENERGYM_CONFIG.hero.imageSrc,
    customHeroUrl: state.heroImageUrl,
    isCustomHeroImage: Boolean(state.heroImageUrl),
    galleryPhotos,
    trainers,
  };
}

export function useHeroImageSource() {
  const { heroImageSrc, customHeroUrl, isCustomHeroImage } = useSiteAppearance();
  return { heroImageSrc, customHeroUrl, isCustomHeroImage };
}
