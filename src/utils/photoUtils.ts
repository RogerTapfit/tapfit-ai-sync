import { FoodPhotoUploadService } from '@/services/foodPhotoUploadService';

export interface FoodEntryWithPhotos {
  photo_url?: string;
  photo_urls?: string[];
  thumbnail_url?: string;
  thumbnail_urls?: string[];
  photo_storage_path?: string;
  photo_storage_paths?: string[];
}

const isHttpUrl = (s?: string) => !!s && /^(https?:)?\/\//i.test(s);
const looksLikePath = (s?: string) => !!s && !isHttpUrl(s) && !s.startsWith('data:') && /[\/.]/.test(s);

const toPublicUrl = (maybeUrl?: string): string | undefined => {
  if (!maybeUrl) return undefined;
  if (isHttpUrl(maybeUrl)) return maybeUrl;
  if (looksLikePath(maybeUrl)) {
    try {
      return FoodPhotoUploadService.getPhotoUrl(maybeUrl);
    } catch (e) {
      console.warn('Failed to convert path to public URL:', maybeUrl, e);
    }
  }
  return undefined;
};

/**
 * Get the best available photo URL from a food entry
 * Priority: photo_url > photo_urls[0] > thumbnail_url > thumbnail_urls[0] > storage paths
 */
export const getBestPhotoUrl = (entry: FoodEntryWithPhotos): string | undefined => {
  // Direct URL or path in primary fields
  const candidates: (string | undefined)[] = [
    entry.photo_url,
    entry.photo_urls?.[0],
    entry.thumbnail_url,
    entry.thumbnail_urls?.[0],
    entry.photo_storage_path,
    entry.photo_storage_paths?.[0],
  ];

  for (const c of candidates) {
    const resolved = toPublicUrl(c);
    if (resolved) return resolved;
  }
  return undefined;
};

/**
 * Get the best thumbnail URL (prefers thumbnail fields, then falls back to photo)
 */
export const getBestThumbnailUrl = (entry: FoodEntryWithPhotos): string | undefined => {
  const thumbCandidates: (string | undefined)[] = [
    entry.thumbnail_url,
    entry.thumbnail_urls?.[0],
  ];
  for (const c of thumbCandidates) {
    const resolved = toPublicUrl(c);
    if (resolved) return resolved;
  }
  return getBestPhotoUrl(entry);
};
