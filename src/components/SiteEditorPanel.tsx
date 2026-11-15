import { ChangeEvent, DragEvent, FormEvent, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Dumbbell,
  Image as ImageIcon,
  RotateCcw,
  Upload,
  Users,
} from 'lucide-react';
import { ENERGYM_CONFIG } from '../config/energymConfig';
import { setActiveSiteAppearance, useSiteAppearance } from '../utils/siteAppearanceClient';
import { SmartImage } from './SmartImage';

interface SiteEditorPanelProps {
  passcode: string;
  open: boolean;
}

type EditorSection = 'hero' | 'gallery' | 'trainers';

interface NoticeState {
  type: 'success' | 'error';
  text: string;
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function readSelectedImageFile(
  file: File,
  onSuccess: (dataUrl: string, fileName: string) => void,
  onError: (message: string) => void
) {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    onError('Please choose a JPG, PNG, WebP, AVIF, or GIF photo.');
    return;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    onError('Image file is larger than 8 MB. Please choose a smaller photo.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      onSuccess(reader.result, file.name);
    }
  };
  reader.onerror = () => {
    onError('Could not read the selected image file.');
  };
  reader.readAsDataURL(file);
}

function getSafePreviewUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (/^https?:\/\/\S+$/i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  return '';
}

export function SiteEditorPanel({ passcode, open }: SiteEditorPanelProps) {
  const {
    heroImageSrc,
    customHeroUrl,
    isCustomHeroImage,
    galleryPhotos,
    trainers,
  } = useSiteAppearance();

  const [section, setSection] = useState<EditorSection>('hero');
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  // Hero state
  const [heroFileDataUrl, setHeroFileDataUrl] = useState<string | null>(null);
  const [heroFileName, setHeroFileName] = useState<string | null>(null);
  const [heroUrlDraft, setHeroUrlDraft] = useState('');
  const [isDraggingHero, setIsDraggingHero] = useState(false);
  const heroInputRef = useRef<HTMLInputElement | null>(null);

  // Gallery state
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    ENERGYM_CONFIG.gallery[0]?.id || 'free-weights'
  );
  const [galleryFileDataUrl, setGalleryFileDataUrl] = useState<string | null>(null);
  const [galleryFileName, setGalleryFileName] = useState<string | null>(null);
  const [galleryUrlDraft, setGalleryUrlDraft] = useState('');
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Trainer state
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>(
    ENERGYM_CONFIG.trainers[0]?.id || 'coach-rohit'
  );
  const [trainerNameDraft, setTrainerNameDraft] = useState('');
  const [trainerSpecialityDraft, setTrainerSpecialityDraft] = useState('');
  const [trainerYearsDraft, setTrainerYearsDraft] = useState('');
  const [trainerFileDataUrl, setTrainerFileDataUrl] = useState<string | null>(null);
  const [trainerFileName, setTrainerFileName] = useState<string | null>(null);
  const [trainerUrlDraft, setTrainerUrlDraft] = useState('');
  const trainerInputRef = useRef<HTMLInputElement | null>(null);

  const selectedGalleryPhoto =
    galleryPhotos.find((photo) => photo.id === selectedGalleryId) || galleryPhotos[0];
  const selectedTrainer =
    trainers.find((trainer) => trainer.id === selectedTrainerId) || trainers[0];

  // Reset drafts cleanly when modal opens
  useEffect(() => {
    if (!open) return;
    setNotice(null);
    setHeroFileDataUrl(null);
    setHeroFileName(null);
    setHeroUrlDraft(customHeroUrl && !customHeroUrl.startsWith('/uploads/') ? customHeroUrl : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Sync selected gallery draft when switching gallery slot or opening modal
  useEffect(() => {
    if (!open || !selectedGalleryPhoto) return;
    setGalleryFileDataUrl(null);
    setGalleryFileName(null);
    setGalleryUrlDraft(
      selectedGalleryPhoto.customImageUrl && !selectedGalleryPhoto.customImageUrl.startsWith('/uploads/')
        ? selectedGalleryPhoto.customImageUrl
        : ''
    );
  }, [open, selectedGalleryId, selectedGalleryPhoto?.customImageUrl]);

  // Sync selected trainer draft when switching trainer card or opening modal
  useEffect(() => {
    if (!open || !selectedTrainer) return;
    setTrainerNameDraft(selectedTrainer.name);
    setTrainerSpecialityDraft(selectedTrainer.speciality);
    setTrainerYearsDraft(String(selectedTrainer.experienceYears));
    setTrainerFileDataUrl(null);
    setTrainerFileName(null);
    setTrainerUrlDraft(
      selectedTrainer.customPhotoUrl && !selectedTrainer.customPhotoUrl.startsWith('/uploads/')
        ? selectedTrainer.customPhotoUrl
        : ''
    );
  }, [
    open,
    selectedTrainerId,
    selectedTrainer?.name,
    selectedTrainer?.speciality,
    selectedTrainer?.experienceYears,
    selectedTrainer?.customPhotoUrl,
  ]);

  const handleSectionChange = (next: EditorSection) => {
    setSection(next);
    setNotice(null);
  };

  // --- HERO HANDLERS ---
  const handleHeroFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNotice(null);
      readSelectedImageFile(
        file,
        (dataUrl, fileName) => {
          setHeroFileDataUrl(dataUrl);
          setHeroFileName(fileName);
          setHeroUrlDraft('');
        },
        (msg) => setNotice({ type: 'error', text: msg })
      );
    }
    event.target.value = '';
  };

  const handleHeroDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingHero(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      setNotice(null);
      readSelectedImageFile(
        file,
        (dataUrl, fileName) => {
          setHeroFileDataUrl(dataUrl);
          setHeroFileName(fileName);
          setHeroUrlDraft('');
        },
        (msg) => setNotice({ type: 'error', text: msg })
      );
    }
  };

  const handleSaveHero = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const trimmedUrl = heroUrlDraft.trim();
    if (!heroFileDataUrl && !trimmedUrl) {
      setNotice({ type: 'error', text: 'Upload an image file or paste an image URL first.' });
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch('/api/owner/hero-image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-owner-passcode': passcode,
        },
        body: JSON.stringify(
          heroFileDataUrl ? { imageDataUrl: heroFileDataUrl } : { imageUrl: trimmedUrl }
        ),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setNotice({
          type: 'error',
          text: typeof data?.error === 'string' ? data.error : 'Could not update hero image.',
        });
        return;
      }
      setActiveSiteAppearance(data.appearance || data);
      setHeroFileDataUrl(null);
      setHeroFileName(null);
      setNotice({
        type: 'success',
        text: 'Hero background updated! The first page now displays your new image.',
      });
    } catch {
      setNotice({ type: 'error', text: 'Network error while saving hero image.' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetHero = async () => {
    setNotice(null);
    setIsBusy(true);
    try {
      const response = await fetch('/api/owner/hero-image', {
        method: 'DELETE',
        headers: { 'x-owner-passcode': passcode },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setNotice({
          type: 'error',
          text: typeof data?.error === 'string' ? data.error : 'Could not reset hero image.',
        });
        return;
      }
      setActiveSiteAppearance(data.appearance || data);
      setHeroFileDataUrl(null);
      setHeroFileName(null);
      setHeroUrlDraft('');
      setNotice({
        type: 'success',
        text: 'Restored the default Energym hero background image.',
      });
    } catch {
      setNotice({ type: 'error', text: 'Network error while resetting hero image.' });
    } finally {
      setIsBusy(false);
    }
  };

  // --- GALLERY HANDLERS ---
  const handleGalleryFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNotice(null);
      readSelectedImageFile(
        file,
        (dataUrl, fileName) => {
          setGalleryFileDataUrl(dataUrl);
          setGalleryFileName(fileName);
          setGalleryUrlDraft('');
        },
        (msg) => setNotice({ type: 'error', text: msg })
      );
    }
    event.target.value = '';
  };

  const handleSaveGalleryPhoto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGalleryPhoto) return;
    setNotice(null);
    const trimmedUrl = galleryUrlDraft.trim();
    if (!galleryFileDataUrl && !trimmedUrl) {
      setNotice({
        type: 'error',
        text: 'Choose a photo file or paste an image URL first.',
      });
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch(
        `/api/owner/gallery-image/${encodeURIComponent(selectedGalleryPhoto.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-owner-passcode': passcode,
          },
          body: JSON.stringify(
            galleryFileDataUrl ? { imageDataUrl: galleryFileDataUrl } : { imageUrl: trimmedUrl }
          ),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setNotice({
          type: 'error',
          text: typeof data?.error === 'string' ? data.error : 'Could not update gallery photo.',
        });
        return;
      }
      setActiveSiteAppearance(data.appearance);
      setGalleryFileDataUrl(null);
      setGalleryFileName(null);
      setNotice({
        type: 'success',
        text: `Updated "${selectedGalleryPhoto.caption}" photo on the website.`,
      });
    } catch {
      setNotice({ type: 'error', text: 'Network error while updating gallery photo.' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetGalleryPhoto = async () => {
    if (!selectedGalleryPhoto) return;
    setNotice(null);
    setIsBusy(true);
    try {
      const response = await fetch(
        `/api/owner/gallery-image/${encodeURIComponent(selectedGalleryPhoto.id)}`,
        {
          method: 'DELETE',
          headers: { 'x-owner-passcode': passcode },
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setNotice({
          type: 'error',
          text: typeof data?.error === 'string' ? data.error : 'Could not reset gallery photo.',
        });
        return;
      }
      setActiveSiteAppearance(data.appearance);
      setGalleryFileDataUrl(null);
      setGalleryFileName(null);
      setGalleryUrlDraft('');
      setNotice({
        type: 'success',
        text: `Restored default photo for "${selectedGalleryPhoto.caption}".`,
      });
    } catch {
      setNotice({ type: 'error', text: 'Network error while resetting gallery photo.' });
    } finally {
      setIsBusy(false);
    }
  };

  // --- TRAINER HANDLERS ---
  const handleTrainerFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNotice(null);
      readSelectedImageFile(
        file,
        (dataUrl, fileName) => {
          setTrainerFileDataUrl(dataUrl);
          setTrainerFileName(fileName);
          setTrainerUrlDraft('');
        },
        (msg) => setNotice({ type: 'error', text: msg })
      );
    }
    event.target.value = '';
  };

  const handleSaveTrainer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTrainer) return;
    setNotice(null);

    const trimmedName = trainerNameDraft.trim();
    if (trimmedName.length < 2) {
      setNotice({ type: 'error', text: 'Trainer name must be at least 2 characters.' });
      return;
    }

    setIsBusy(true);
    try {
      const payload: Record<string, unknown> = {
        name: trimmedName,
        speciality: trainerSpecialityDraft.trim(),
        experienceYears: trainerYearsDraft.trim(),
      };
      if (trainerFileDataUrl) {
        payload.imageDataUrl = trainerFileDataUrl;
      } else if (trainerUrlDraft.trim()) {
        payload.imageUrl = trainerUrlDraft.trim();
      }

      const response = await fetch(
        `/api/owner/trainer/${encodeURIComponent(selectedTrainer.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-owner-passcode': passcode,
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setNotice({
          type: 'error',
          text: typeof data?.error === 'string' ? data.error : 'Could not update trainer details.',
        });
        return;
      }

      setActiveSiteAppearance(data.appearance);
      setTrainerFileDataUrl(null);
      setTrainerFileName(null);
      setNotice({
        type: 'success',
        text: `Updated coach "${trimmedName}" on the website!`,
      });
    } catch {
      setNotice({ type: 'error', text: 'Network error while saving trainer.' });
    } finally {
      setIsBusy(false);
    }
  };

  const handleResetTrainer = async () => {
    if (!selectedTrainer) return;
    setNotice(null);
    setIsBusy(true);
    try {
      const response = await fetch(
        `/api/owner/trainer/${encodeURIComponent(selectedTrainer.id)}`,
        {
          method: 'DELETE',
          headers: { 'x-owner-passcode': passcode },
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.ok) {
        setNotice({
          type: 'error',
          text: typeof data?.error === 'string' ? data.error : 'Could not reset trainer.',
        });
        return;
      }
      setActiveSiteAppearance(data.appearance);
      setTrainerFileDataUrl(null);
      setTrainerFileName(null);
      setTrainerUrlDraft('');
      setNotice({
        type: 'success',
        text: 'Restored default trainer name, details, and photo.',
      });
    } catch {
      setNotice({ type: 'error', text: 'Network error while resetting trainer.' });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-navigation for Hero, Gym Gallery, and Trainers */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleSectionChange('hero')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
            section === 'hero'
              ? 'bg-[#1A1A1A] text-white border-[#22C55E]'
              : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#2A2A2A] hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-[#22C55E]" aria-hidden="true" />
          <span>Hero Background (1)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSectionChange('gallery')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
            section === 'gallery'
              ? 'bg-[#1A1A1A] text-white border-[#22C55E]'
              : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#2A2A2A] hover:text-white'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5 text-[#22C55E]" aria-hidden="true" />
          <span>Gym Gallery ({galleryPhotos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSectionChange('trainers')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
            section === 'trainers'
              ? 'bg-[#1A1A1A] text-white border-[#22C55E]'
              : 'bg-[#1A1A1A] text-[#A3A3A3] border-[#2A2A2A] hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#22C55E]" aria-hidden="true" />
          <span>Trainers &amp; Names ({trainers.length})</span>
        </button>
      </div>

      {/* SECTION 1: HERO BACKGROUND */}
      {section === 'hero' && (
        <form onSubmit={handleSaveHero} className="rounded-md bg-[#1A1A1A] border border-[#2A2A2A] p-4 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-white">First Page Background Image</h3>
              <p className="text-xs text-[#A3A3A3] mt-0.5">
                Upload your own gym photo or paste an image link to update the hero section immediately.
              </p>
            </div>
            <span className="text-[11px] font-medium text-[#22C55E]">
              {heroFileDataUrl
                ? 'Previewing Selected File'
                : isCustomHeroImage
                  ? 'Custom Photo Active'
                  : 'Default Photo Active'}
            </span>
          </div>

          <div className="relative h-40 sm:h-48 w-full rounded-md overflow-hidden border border-[#2A2A2A] bg-[#0A0A0A]">
            {(() => {
              const previewSrc = heroFileDataUrl || getSafePreviewUrl(heroUrlDraft) || heroImageSrc;
              return (
                <SmartImage
                  key={previewSrc}
                  src={previewSrc}
                  alt="Hero background preview"
                  placeholderLabel="Preview unavailable — check image URL"
                  loading="eager"
                  className="w-full h-full object-cover object-center"
                />
              );
            })()}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/90 via-[#0A0A0A]/65 to-[#0A0A0A]/25"
            />
            <div className="absolute inset-0 flex flex-col justify-center p-4 sm:p-6 max-w-sm">
              <span className="text-[10px] font-medium text-[#A3A3A3]">
                {ENERGYM_CONFIG.hero.locationLine}
              </span>
              <span className="mt-1 text-base sm:text-lg font-bold text-white leading-tight">
                {ENERGYM_CONFIG.hero.headline}
              </span>
            </div>
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingHero(true);
            }}
            onDragLeave={() => setIsDraggingHero(false)}
            onDrop={handleHeroDrop}
            className={`rounded-md border border-dashed p-3.5 transition-colors ${
              isDraggingHero
                ? 'border-[#22C55E] bg-[#0A0A0A]'
                : 'border-[#2A2A2A] bg-[#0A0A0A]/70'
            }`}
          >
            <input
              ref={heroInputRef}
              id="hero-image-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              onChange={handleHeroFileChange}
              className="sr-only"
            />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {heroFileName ? `Selected: ${heroFileName}` : 'Upload photo from device'}
                </p>
                <p className="text-[11px] text-[#A3A3A3]">
                  Drag &amp; drop or choose a JPG, PNG, or WebP landscape photo (max 8 MB)
                </p>
              </div>
              <button
                type="button"
                onClick={() => heroInputRef.current?.click()}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-xs font-semibold text-white hover:border-[#22C55E] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Upload className="w-3.5 h-3.5 text-[#22C55E]" aria-hidden="true" />
                <span>{heroFileName ? 'Change File' : 'Choose Image'}</span>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="hero-image-url-input"
              className="block text-xs font-medium text-white mb-1.5"
            >
              Or Paste Image URL
            </label>
            <input
              id="hero-image-url-input"
              type="url"
              placeholder="https://example.com/energym-floor.jpg"
              value={heroUrlDraft}
              onChange={(e) => {
                setHeroUrlDraft(e.target.value);
                if (heroFileDataUrl) {
                  setHeroFileDataUrl(null);
                  setHeroFileName(null);
                }
                if (notice) setNotice(null);
              }}
              className="w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3.5 py-2 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none"
            />
          </div>

          {notice && <EditorNoticeBanner notice={notice} />}

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              disabled={isBusy || (!isCustomHeroImage && !heroFileDataUrl && !heroUrlDraft.trim())}
              onClick={() => void handleResetHero()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-semibold text-[#A3A3A3] hover:text-white hover:border-[#22C55E] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset to Default</span>
            </button>
            <button
              type="submit"
              disabled={isBusy || (!heroFileDataUrl && !heroUrlDraft.trim())}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#22C55E] text-[#0A0A0A] text-xs font-semibold hover:bg-[#16A34A] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isBusy ? 'Saving...' : 'Save Hero Image'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: GYM GALLERY (6 PHOTOS) */}
      {section === 'gallery' && selectedGalleryPhoto && (
        <div className="space-y-3.5">
          {/* 6-slot Thumbnail Selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {galleryPhotos.map((photo) => {
              const isSelected = photo.id === selectedGalleryPhoto.id;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    setSelectedGalleryId(photo.id);
                    setNotice(null);
                  }}
                  aria-label={`Edit gallery photo: ${photo.caption}`}
                  className={`group rounded-md border overflow-hidden text-left transition-colors cursor-pointer bg-[#1A1A1A] ${
                    isSelected ? 'border-[#22C55E]' : 'border-[#2A2A2A] hover:border-[#A3A3A3]/60'
                  }`}
                >
                  <div className="relative h-20 w-full bg-[#0A0A0A]">
                    <SmartImage
                      key={photo.src}
                      src={photo.src}
                      alt={photo.alt}
                      placeholderLabel={photo.placeholderLabel}
                      className="w-full h-full object-cover"
                    />
                    {photo.isCustomImage && (
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#0A0A0A]/85 border border-[#22C55E] text-[10px] font-medium text-[#22C55E]">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="px-2.5 py-1.5 text-[11px] font-medium text-white truncate">
                    {photo.caption.split('—')[0].trim()}
                  </p>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleSaveGalleryPhoto}
            className="rounded-md bg-[#1A1A1A] border border-[#2A2A2A] p-4 space-y-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">
                  {selectedGalleryPhoto.caption}
                </h3>
                <p className="text-xs text-[#A3A3A3] mt-0.5">
                  Replace this Inside Energym photo with your own upload or URL.
                </p>
              </div>
              <span className="text-[11px] font-medium text-[#22C55E]">
                {galleryFileDataUrl
                  ? 'Previewing File'
                  : selectedGalleryPhoto.isCustomImage
                    ? 'Custom Photo Active'
                    : 'Default Photo Active'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
              <div className="sm:col-span-5 aspect-[4/3] w-full rounded-md overflow-hidden border border-[#2A2A2A] bg-[#0A0A0A]">
                {(() => {
                  const previewSrc =
                    galleryFileDataUrl ||
                    getSafePreviewUrl(galleryUrlDraft) ||
                    selectedGalleryPhoto.src;
                  return (
                    <SmartImage
                      key={previewSrc}
                      src={previewSrc}
                      alt={selectedGalleryPhoto.caption}
                      placeholderLabel="Preview unavailable"
                      loading="eager"
                      className="w-full h-full object-cover"
                    />
                  );
                })()}
              </div>

              <div className="sm:col-span-7 space-y-3">
                <div>
                  <input
                    ref={galleryInputRef}
                    id="gallery-image-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                    onChange={handleGalleryFileChange}
                    className="sr-only"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-[#2A2A2A] bg-[#0A0A0A]/70 p-3">
                    <span className="text-xs text-white truncate max-w-[200px]">
                      {galleryFileName || 'Upload photo (max 8 MB)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#2A2A2A] text-xs font-semibold text-white hover:border-[#22C55E] cursor-pointer whitespace-nowrap"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#22C55E]" aria-hidden="true" />
                      <span>{galleryFileName ? 'Change File' : 'Choose Image'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="gallery-image-url-input"
                    className="block text-xs font-medium text-white mb-1.5"
                  >
                    Or Paste Image URL
                  </label>
                  <input
                    id="gallery-image-url-input"
                    type="url"
                    placeholder="https://example.com/gym-zone.jpg"
                    value={galleryUrlDraft}
                    onChange={(e) => {
                      setGalleryUrlDraft(e.target.value);
                      if (galleryFileDataUrl) {
                        setGalleryFileDataUrl(null);
                        setGalleryFileName(null);
                      }
                      if (notice) setNotice(null);
                    }}
                    className="w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {notice && <EditorNoticeBanner notice={notice} />}

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                disabled={
                  isBusy ||
                  (!selectedGalleryPhoto.isCustomImage &&
                    !galleryFileDataUrl &&
                    !galleryUrlDraft.trim())
                }
                onClick={() => void handleResetGalleryPhoto()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-semibold text-[#A3A3A3] hover:text-white hover:border-[#22C55E] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Photo</span>
              </button>

              <button
                type="submit"
                disabled={isBusy || (!galleryFileDataUrl && !galleryUrlDraft.trim())}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#22C55E] text-[#0A0A0A] text-xs font-semibold hover:bg-[#16A34A] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ImageIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isBusy ? 'Saving...' : 'Save Gallery Photo'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 3: TRAINERS (PHOTO + NAME + SPECIALITY + EXPERIENCE) */}
      {section === 'trainers' && selectedTrainer && (
        <div className="space-y-3.5">
          {/* 3-card Trainer Selector */}
          <div className="grid grid-cols-3 gap-2.5">
            {trainers.map((trainer, index) => {
              const isSelected = trainer.id === selectedTrainer.id;
              return (
                <button
                  key={trainer.id}
                  type="button"
                  onClick={() => {
                    setSelectedTrainerId(trainer.id);
                    setNotice(null);
                  }}
                  aria-label={`Edit trainer: ${trainer.name}`}
                  className={`rounded-md border p-2.5 text-left transition-colors cursor-pointer bg-[#1A1A1A] flex items-center gap-2.5 min-w-0 ${
                    isSelected ? 'border-[#22C55E]' : 'border-[#2A2A2A] hover:border-[#A3A3A3]/60'
                  }`}
                >
                  <div className="w-10 h-12 rounded overflow-hidden bg-[#0A0A0A] shrink-0 border border-[#2A2A2A]">
                    <SmartImage
                      key={trainer.photoSrc}
                      src={trainer.photoSrc}
                      alt={trainer.name}
                      placeholderLabel={trainer.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[#22C55E]">Coach {index + 1}</p>
                    <p className="text-xs font-semibold text-white truncate">{trainer.name}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleSaveTrainer}
            className="rounded-md bg-[#1A1A1A] border border-[#2A2A2A] p-4 space-y-3.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Portrait Preview & Photo Upload */}
              <div className="sm:col-span-4 space-y-2.5">
                <div className="aspect-[3/4] max-h-48 sm:max-h-none w-full rounded-md overflow-hidden border border-[#2A2A2A] bg-[#0A0A0A]">
                  {(() => {
                    const previewSrc =
                      trainerFileDataUrl ||
                      getSafePreviewUrl(trainerUrlDraft) ||
                      selectedTrainer.photoSrc;
                    return (
                      <SmartImage
                        key={previewSrc}
                        src={previewSrc}
                        alt={trainerNameDraft || selectedTrainer.name}
                        placeholderLabel="Preview unavailable"
                        loading="eager"
                        className="w-full h-full object-cover object-top"
                      />
                    );
                  })()}
                </div>

                <input
                  ref={trainerInputRef}
                  id="trainer-photo-file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                  onChange={handleTrainerFileChange}
                  className="sr-only"
                />
                <button
                  type="button"
                  onClick={() => trainerInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-semibold text-white hover:border-[#22C55E] transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#22C55E]" aria-hidden="true" />
                  <span className="truncate">
                    {trainerFileName ? `Selected: ${trainerFileName}` : 'Upload Coach Photo'}
                  </span>
                </button>
              </div>

              {/* Trainer Name, Speciality, Experience & URL */}
              <div className="sm:col-span-8 space-y-3">
                <div>
                  <label
                    htmlFor="trainer-name-input"
                    className="block text-xs font-medium text-white mb-1.5"
                  >
                    Trainer Name
                  </label>
                  <input
                    id="trainer-name-input"
                    type="text"
                    placeholder="e.g. Rohit Sharma"
                    value={trainerNameDraft}
                    onChange={(e) => {
                      setTrainerNameDraft(e.target.value);
                      if (notice) setNotice(null);
                    }}
                    className="w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="trainer-speciality-input"
                      className="block text-xs font-medium text-white mb-1.5"
                    >
                      Speciality
                    </label>
                    <input
                      id="trainer-speciality-input"
                      type="text"
                      placeholder="e.g. Strength & Powerlifting"
                      value={trainerSpecialityDraft}
                      onChange={(e) => {
                        setTrainerSpecialityDraft(e.target.value);
                        if (notice) setNotice(null);
                      }}
                      className="w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="trainer-years-input"
                      className="block text-xs font-medium text-white mb-1.5"
                    >
                      Years Exp.
                    </label>
                    <input
                      id="trainer-years-input"
                      type="number"
                      min={0}
                      max={60}
                      value={trainerYearsDraft}
                      onChange={(e) => {
                        setTrainerYearsDraft(e.target.value);
                        if (notice) setNotice(null);
                      }}
                      className="w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-sm text-white focus:border-[#22C55E] focus:outline-none tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="trainer-photo-url-input"
                    className="block text-xs font-medium text-white mb-1.5"
                  >
                    Or Paste Coach Photo URL
                  </label>
                  <input
                    id="trainer-photo-url-input"
                    type="url"
                    placeholder="https://example.com/coach-photo.jpg"
                    value={trainerUrlDraft}
                    onChange={(e) => {
                      setTrainerUrlDraft(e.target.value);
                      if (trainerFileDataUrl) {
                        setTrainerFileDataUrl(null);
                        setTrainerFileName(null);
                      }
                      if (notice) setNotice(null);
                    }}
                    className="w-full rounded-md bg-[#0A0A0A] border border-[#2A2A2A] px-3 py-2 text-sm text-white placeholder:text-[#A3A3A3]/60 focus:border-[#22C55E] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {notice && <EditorNoticeBanner notice={notice} />}

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                disabled={isBusy || (!selectedTrainer.isCustomProfile && !trainerFileDataUrl && !trainerUrlDraft.trim())}
                onClick={() => void handleResetTrainer()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] text-xs font-semibold text-[#A3A3A3] hover:text-white hover:border-[#22C55E] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset Trainer</span>
              </button>

              <button
                type="submit"
                disabled={isBusy || !trainerNameDraft.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#22C55E] text-[#0A0A0A] text-xs font-semibold hover:bg-[#16A34A] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isBusy ? 'Saving...' : 'Save Trainer'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function EditorNoticeBanner({ notice }: { notice: NoticeState }) {
  return (
    <div
      role="status"
      className={`rounded-md bg-[#0A0A0A] border px-4 py-3 text-xs font-medium text-white flex items-start gap-2 ${
        notice.type === 'success' ? 'border-[#22C55E]' : 'border-[#2A2A2A]'
      }`}
    >
      {notice.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" aria-hidden="true" />
      ) : (
        <span aria-hidden="true" className="text-[#22C55E] font-bold">
          !
        </span>
      )}
      <span>{notice.text}</span>
    </div>
  );
}
