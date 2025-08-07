import { supabase } from '@/integrations/supabase/client';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class ImageUploadService {
  private static readonly BUCKET_NAME = 'character-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Initialize the character images bucket if it doesn't exist
   */
  static async initializeBucket(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);
      
      if (!bucketExists) {
        await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE
        });
      }
    } catch (error) {
      console.error('Error initializing character images bucket:', error);
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Please use JPEG, PNG, WebP, or GIF.' };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large. Maximum size is 5MB.' };
    }

    return { valid: true };
  }

  /**
   * Upload character image file to Supabase Storage
   */
  static async uploadCharacterImage(file: File, characterType: string): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Ensure bucket exists
      await this.initializeBucket();

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${characterType}_${timestamp}.${fileExt}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Error uploading character image:', error);
      return { success: false, error: 'Failed to upload image. Please try again.' };
    }
  }

  /**
   * Update character image mapping in user's profile
   */
  static async updateCharacterImage(characterType: string, imageUrl: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Get current profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('avatar_data')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('Error fetching profile:', fetchError);
        return false;
      }

      // Update avatar data with custom character image
      const currentAvatarData = (profile?.avatar_data as any) || {};
      const customImages = currentAvatarData.custom_character_images || {};
      
      const updatedAvatarData = {
        ...currentAvatarData,
        custom_character_images: {
          ...customImages,
          [characterType]: imageUrl
        }
      };

      // Save updated profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_data: updatedAvatarData })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating character image:', error);
      return false;
    }
  }
}