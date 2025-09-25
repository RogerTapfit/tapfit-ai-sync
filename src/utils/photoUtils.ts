import { FoodPhotoUploadService } from '@/services/foodPhotoUploadService';

export interface FoodEntryWithPhotos {
  photo_url?: string;
  photo_urls?: string[];
  thumbnail_url?: string;
  thumbnail_urls?: string[];
  photo_storage_path?: string;
  photo_storage_paths?: string[];
}

/**
 * Get the best available photo URL from a food entry
 * Prioritizes: photo_url > photo_urls[0] > thumbnail_url > thumbnail_urls[0] > storage_path converted to URL
 */
export const getBestPhotoUrl = (entry: FoodEntryWithPhotos): string | undefined => {
  // Try direct URL fields first
  if (entry.photo_url && entry.photo_url.trim() !== '' && !entry.photo_url.startsWith('data:')) {
    return entry.photo_url;
  }
  
  if (entry.photo_urls && entry.photo_urls.length > 0) {
    const firstUrl = entry.photo_urls[0];
    if (firstUrl && firstUrl.trim() !== '' && !firstUrl.startsWith('data:')) {
      return firstUrl;
    }
  }
  
  if (entry.thumbnail_url && entry.thumbnail_url.trim() !== '' && !entry.thumbnail_url.startsWith('data:')) {
    return entry.thumbnail_url;
  }
  
  if (entry.thumbnail_urls && entry.thumbnail_urls.length > 0) {
    const firstThumb = entry.thumbnail_urls[0];
    if (firstThumb && firstThumb.trim() !== '' && !firstThumb.startsWith('data:')) {
      return firstThumb;
    }
  }
  
  // Fallback to storage paths - convert to public URLs
  if (entry.photo_storage_path && entry.photo_storage_path.trim() !== '') {
    try {
      return FoodPhotoUploadService.getPhotoUrl(entry.photo_storage_path);
    } catch (error) {
      console.warn('Failed to get URL for storage path:', entry.photo_storage_path, error);
    }
  }
  
  if (entry.photo_storage_paths && entry.photo_storage_paths.length > 0) {
    const firstStoragePath = entry.photo_storage_paths[0];
    if (firstStoragePath && firstStoragePath.trim() !== '') {
      try {
        return FoodPhotoUploadService.getPhotoUrl(firstStoragePath);
      } catch (error) {
        console.warn('Failed to get URL for storage path:', firstStoragePath, error);
      }
    }
  }
  
  return undefined;
};

/**
 * Get the best available thumbnail URL from a food entry
 * Prioritizes: thumbnail_url > thumbnail_urls[0] > photo_url > photo_urls[0] > storage_path converted to URL
 */
export const getBestThumbnailUrl = (entry: FoodEntryWithPhotos): string | undefined => {
  // Try thumbnail fields first
  if (entry.thumbnail_url && entry.thumbnail_url.trim() !== '' && !entry.thumbnail_url.startsWith('data:')) {
    return entry.thumbnail_url;
  }
  
  if (entry.thumbnail_urls && entry.thumbnail_urls.length > 0) {
    const firstThumb = entry.thumbnail_urls[0];
    if (firstThumb && firstThumb.trim() !== '' && !firstThumb.startsWith('data:')) {
      return firstThumb;
    }
  }
  
  // Fallback to main photo fields
  return getBestPhotoUrl(entry);
};