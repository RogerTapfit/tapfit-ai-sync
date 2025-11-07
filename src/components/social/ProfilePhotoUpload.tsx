import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProfilePhotoUploadProps {
  currentAvatarUrl?: string | null;
  username?: string | null;
  onUploadSuccess?: () => void;
}

export const ProfilePhotoUpload = ({ 
  currentAvatarUrl, 
  username,
  onUploadSuccess 
}: ProfilePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const getInitials = () => {
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(existingFiles.map(f => `${user.id}/${f.name}`));
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Profile photo updated!');
      setLocalPreview(publicUrl);
      onUploadSuccess?.();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  };

  const displayUrl = localPreview || currentAvatarUrl;

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        <AvatarImage src={displayUrl || undefined} alt="Profile photo" />
        <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
      </Avatar>
      <div>
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => document.getElementById('avatar-upload')?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              {currentAvatarUrl ? 'Change Photo' : 'Upload Photo'}
            </>
          )}
        </Button>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={uploading}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Max 5MB • JPG, PNG, or WEBP
        </p>
      </div>
    </div>
  );
};
