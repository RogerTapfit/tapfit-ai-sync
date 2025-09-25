import { supabase } from '@/integrations/supabase/client';
import { processImageFile } from '@/utils/heicConverter';

interface PhotoUploadResult {
  success: boolean;
  photoUrl?: string;
  storagePath?: string;
  thumbnailUrl?: string;
  error?: string;
}

export class FoodPhotoUploadService {
  private static readonly BUCKET_NAME = 'food-photos';
  private static readonly MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 second
  
  /**
   * Verify bucket accessibility with test upload/delete
   */
  static async verifyBucketAccess(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Create a test file
      const testData = new Blob(['test'], { type: 'text/plain' });
      const testPath = `${user.id}/test_${Date.now()}.txt`;
      
      // Upload test file
      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(testPath, testData);
        
      if (uploadError) {
        console.error('Bucket access test failed:', uploadError);
        return false;
      }
      
      // Clean up test file
      await supabase.storage.from(this.BUCKET_NAME).remove([testPath]);
      
      return true;
    } catch (error) {
      console.error('Bucket verification failed:', error);
      return false;
    }
  }

  /**
   * Initialize and verify bucket
   */
  static async ensureBucketExists(): Promise<boolean> {
    try {
      // First try to access existing bucket
      const canAccess = await this.verifyBucketAccess();
      if (canAccess) {
        console.log('Bucket access verified');
        return true;
      }

      // Try to create bucket if access failed
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
      
      if (!bucketExists) {
        console.log('Creating food-photos bucket...');
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE
        });
        
        if (error) {
          console.error('Failed to create bucket:', error);
          return false;
        }
      }

      // Verify access after creation
      return await this.verifyBucketAccess();
    } catch (error) {
      console.error('Bucket initialization failed:', error);
      return false;
    }
  }

  /**
   * Sleep utility for retries
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate photo file before upload
   */
  static validatePhoto(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, WebP, or GIF.' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large. Maximum size is 25MB.' };
    }

    return { valid: true };
  }

  /**
   * Create thumbnail from original image
   */
  static async createThumbnail(file: File, maxSize: number = 300): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // Draw resized image
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to blob and create file
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], `thumb_${file.name}`, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(thumbnailFile);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        }, file.type, 0.8);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Convert data URL to File object
   */
  static dataURLtoFile(dataUrl: string, filename: string): File {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Upload multiple food photos to Supabase Storage
   */
  static async uploadMultipleFoodPhotos(
    photos: Array<{ dataUrl: string; type: string; file?: File }>,
    mealType: string = 'meal'
  ): Promise<{ success: boolean; photos: any[]; errors: string[] }> {
    // Ensure bucket exists first
    await this.ensureBucketExists();
    
    const results = [];
    const errors = [];

    for (const [index, photo] of photos.entries()) {
      const filename = `food_photo_${Date.now()}_${index}.jpg`;
      
      // Use the file if available, otherwise convert from dataUrl
      let fileToUpload: File;
      if (photo.file) {
        fileToUpload = photo.file;
      } else {
        fileToUpload = this.dataURLtoFile(photo.dataUrl, filename);
      }
      
      const result = await this.uploadFoodPhoto(fileToUpload, mealType, filename);
      
      if (result.success) {
        results.push({
          photoUrl: result.photoUrl,
          storagePath: result.storagePath,
          thumbnailUrl: result.thumbnailUrl,
          photoType: photo.type
        });
      } else {
        errors.push(`Photo ${index + 1}: ${result.error}`);
      }
    }

    return {
      success: results.length > 0,
      photos: results,
      errors
    };
  }

  /**
   * Upload food photo with retries and validation
   */
  static async uploadFoodPhoto(
    fileOrDataUrl: File | string, 
    mealType: string = 'meal',
    originalFilename?: string,
    retryCount: number = 0
  ): Promise<PhotoUploadResult> {
    try {
      // Ensure bucket exists and is accessible
      const bucketReady = await this.ensureBucketExists();
      if (!bucketReady) {
        return { success: false, error: 'Storage bucket not accessible. Please try again later.' };
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Convert data URL to file if needed
      let file: File;
      if (typeof fileOrDataUrl === 'string') {
        if (fileOrDataUrl.startsWith('data:')) {
          const filename = originalFilename || `food_photo_${Date.now()}.jpg`;
          file = this.dataURLtoFile(fileOrDataUrl, filename);
        } else {
          return { success: false, error: 'Invalid file format' };
        }
      } else {
        file = fileOrDataUrl;
      }

      // Process image (handles HEIC conversion if needed)
      const processedFile = await processImageFile(file);
      
      // Validate file
      const validation = this.validatePhoto(processedFile);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const timestamp = Date.now();
      const fileExt = processedFile.name.split('.').pop() || 'jpg';
      const baseName = `${user.id}/${mealType}_${timestamp}_${retryCount}`;
      const fileName = `${baseName}.${fileExt}`;
      const thumbFileName = `${baseName}_thumb.${fileExt}`;

      // Create thumbnail
      let thumbnailFile: File;
      try {
        thumbnailFile = await this.createThumbnail(processedFile);
      } catch (error) {
        console.warn('Failed to create thumbnail, using original:', error);
        thumbnailFile = processedFile;
      }

      console.log(`[Attempt ${retryCount + 1}/${this.MAX_RETRIES}] Uploading to bucket: ${this.BUCKET_NAME}, path: ${fileName}`);

      // Upload original photo with timeout
      const uploadPromise = supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 30000)
      );

      const { data: photoData, error: photoError } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]) as any;

      if (photoError) {
        console.error(`Upload attempt ${retryCount + 1} failed:`, photoError);
        
        // Retry logic
        if (retryCount < this.MAX_RETRIES - 1) {
          console.log(`Retrying upload in ${this.RETRY_DELAY}ms...`);
          await this.sleep(this.RETRY_DELAY);
          return this.uploadFoodPhoto(fileOrDataUrl, mealType, originalFilename, retryCount + 1);
        }
        
        return { success: false, error: `Upload failed after ${this.MAX_RETRIES} attempts: ${photoError.message}` };
      }

      // Upload thumbnail (non-critical)
      const { data: thumbData, error: thumbError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(thumbFileName, thumbnailFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (thumbError) {
        console.warn('Thumbnail upload failed (non-critical):', thumbError);
      }

      // Get public URLs
      const { data: { publicUrl: photoUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      let thumbnailUrl: string | undefined;
      if (!thumbError && thumbData) {
        const { data: { publicUrl } } = supabase.storage
          .from(this.BUCKET_NAME)
          .getPublicUrl(thumbFileName);
        thumbnailUrl = publicUrl;
      }

      // Verify the uploaded photo is accessible
      const verificationResult = await this.verifyPhotoAccessibility(photoUrl);
      if (!verificationResult.accessible) {
        console.error('Photo not accessible after upload:', verificationResult.error);
        
        // Retry if not accessible
        if (retryCount < this.MAX_RETRIES - 1) {
          await this.sleep(this.RETRY_DELAY);
          return this.uploadFoodPhoto(fileOrDataUrl, mealType, originalFilename, retryCount + 1);
        }
        
        return { success: false, error: 'Photo uploaded but not accessible. Please try again.' };
      }

      console.log('Photo uploaded and verified successfully:', {
        photoUrl,
        storagePath: fileName,
        thumbnailUrl,
        accessible: true
      });

      return {
        success: true,
        photoUrl,
        storagePath: fileName,
        thumbnailUrl
      };
    } catch (error) {
      console.error(`Upload attempt ${retryCount + 1} failed with error:`, error);
      
      // Retry on network errors
      if (retryCount < this.MAX_RETRIES - 1 && (
        error.message.includes('network') || 
        error.message.includes('timeout') ||
        error.message.includes('fetch')
      )) {
        console.log(`Retrying upload due to network error in ${this.RETRY_DELAY}ms...`);
        await this.sleep(this.RETRY_DELAY);
        return this.uploadFoodPhoto(fileOrDataUrl, mealType, originalFilename, retryCount + 1);
      }
      
      return { success: false, error: `Failed to upload photo: ${error.message}` };
    }
  }

  /**
   * Verify photo is accessible via URL
   */
  static async verifyPhotoAccessibility(photoUrl: string): Promise<{ accessible: boolean; error?: string }> {
    try {
      const response = await fetch(photoUrl, { method: 'HEAD' });
      return { 
        accessible: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`
      };
    } catch (error) {
      return { 
        accessible: false, 
        error: error.message 
      };
    }
  }

  /**
   * Delete food photo from storage
   */
  static async deleteFoodPhoto(storagePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([storagePath]);

      if (error) {
        console.error('Error deleting photo:', error);
        return false;
      }

      // Also try to delete thumbnail
      const thumbPath = storagePath.replace(/\.([^.]+)$/, '_thumb.$1');
      await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([thumbPath]);

      return true;
    } catch (error) {
      console.error('Error deleting food photo:', error);
      return false;
    }
  }

  /**
   * Get photo URL from storage path
   */
  static getPhotoUrl(storagePath: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(storagePath);
    return publicUrl;
  }
}