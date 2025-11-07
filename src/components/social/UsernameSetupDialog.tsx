import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import { socialService } from '@/services/socialService';
import { toast } from 'sonner';
import { useDebounceCallback } from '@/hooks/useDebounceCallback';

interface UsernameSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const UsernameSetupDialog = ({ open, onOpenChange, onSuccess }: UsernameSetupDialogProps) => {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [shareStats, setShareStats] = useState(true);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { debouncedCallback: checkAvailability, isLoading: isChecking } = useDebounceCallback(
    async (value: string) => {
      if (!value || formatError) {
        setIsAvailable(null);
        return;
      }
      const available = await socialService.checkUsernameAvailable(value);
      setIsAvailable(available);
    },
    { delay: 500 }
  );

  useEffect(() => {
    if (!username) {
      setFormatError(null);
      setIsAvailable(null);
      return;
    }

    // Format validation
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      if (username.length < 3) {
        setFormatError('Username must be at least 3 characters');
      } else if (username.length > 30) {
        setFormatError('Username must be less than 30 characters');
      } else {
        setFormatError('Username can only contain letters, numbers, underscores, and hyphens');
      }
      setIsAvailable(null);
      return;
    }

    setFormatError(null);
    checkAvailability(username);
  }, [username, checkAvailability]);

  const handleSave = async () => {
    if (!username || formatError || !isAvailable) {
      return;
    }

    setIsSaving(true);
    try {
      const success = await socialService.updateProfile({
        username,
        bio: bio || undefined,
        is_profile_public: isPublic,
        share_workout_stats: shareStats
      });

      if (success) {
        toast.success('Profile updated successfully!');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        toast.error('Username already taken. Please choose another.');
        setIsAvailable(false);
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getValidationIcon = () => {
    if (!username) return null;
    if (formatError) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (isChecking) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (isAvailable === true) return <Check className="h-4 w-4 text-green-500" />;
    if (isAvailable === false) return <X className="h-4 w-4 text-destructive" />;
    return null;
  };

  const getValidationMessage = () => {
    if (formatError) return formatError;
    if (isChecking) return 'Checking availability...';
    if (isAvailable === true) return 'Username available!';
    if (isAvailable === false) return 'Username already taken';
    return null;
  };

  const canSave = username && !formatError && isAvailable === true && !isSaving && !isChecking;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Up Your Username</DialogTitle>
          <DialogDescription>
            Choose a unique username so other users can find and follow you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getValidationIcon()}
              </div>
            </div>
            {username && (
              <p className={`text-sm ${
                formatError || isAvailable === false ? 'text-destructive' : 
                isAvailable === true ? 'text-green-500' : 
                'text-muted-foreground'
              }`}>
                {getValidationMessage()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell others about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Profile</Label>
                <p className="text-xs text-muted-foreground">
                  Allow others to view your profile
                </p>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Share Workout Stats</Label>
                <p className="text-xs text-muted-foreground">
                  Show your workout achievements to followers
                </p>
              </div>
              <Switch checked={shareStats} onCheckedChange={setShareStats} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
