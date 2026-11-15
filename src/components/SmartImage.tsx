import { useEffect, useState } from 'react';
import { Dumbbell } from 'lucide-react';

interface SmartImageProps {
  src?: string;
  alt: string;
  placeholderLabel: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * Resilient image component with lazy loading, no-referrer policy,
 * and a clearly labelled fallback card if a photo is missing or fails to load.
 */
export function SmartImage({
  src,
  alt,
  placeholderLabel,
  className = 'w-full h-full object-cover',
  loading = 'lazy',
  fetchPriority,
}: SmartImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="w-full h-full flex flex-col items-center justify-center bg-[#1A1A1A] border border-[#2A2A2A] p-6 text-center"
      >
        <Dumbbell className="w-8 h-8 text-[#22C55E] mb-3" aria-hidden="true" />
        <p className="text-sm font-medium text-white">{placeholderLabel}</p>
        <p className="text-xs text-[#A3A3A3] mt-1">
          Check the image URL or upload a new photo in Owner Portal
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
