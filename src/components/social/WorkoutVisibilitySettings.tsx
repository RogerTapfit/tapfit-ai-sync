import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Users, Globe, Lock, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

type WorkoutVisibility = 'private' | 'followers' | 'public';

export function WorkoutVisibilitySettings() {
  const [shareWorkoutStats, setShareWorkoutStats] = useState(true);
  const [workoutVisibility, setWorkoutVisibility] = useState<WorkoutVisibility>('followers');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('share_workout_stats, workout_visibility')
        .eq('id', user.id)
        .single();

      if (profile) {
        setShareWorkoutStats(profile.share_workout_stats ?? true);
        setWorkoutVisibility((profile.workout_visibility as WorkoutVisibility) || 'followers');
      }
    } catch (error) {
      console.error('Error loading visibility settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateVisibility = async (visibility: WorkoutVisibility) => {
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ workout_visibility: visibility })
        .eq('id', user.id);

      if (error) throw error;

      setWorkoutVisibility(visibility);
      toast.success('Workout visibility updated');
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update visibility');
    } finally {
      setUpdating(false);
    }
  };

  const toggleWorkoutSharing = async (enabled: boolean) => {
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ share_workout_stats: enabled })
        .eq('id', user.id);

      if (error) throw error;

      setShareWorkoutStats(enabled);
      toast.success(enabled ? 'Workout sharing enabled' : 'Workout sharing disabled');
    } catch (error) {
      console.error('Error toggling workout sharing:', error);
      toast.error('Failed to update setting');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Visibility</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent">
            <Eye className="h-5 w-5" />
          </div>
          Workout Visibility
        </CardTitle>
        <CardDescription>
          Control who can see your workout data and activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Switch */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="space-y-0.5">
            <Label htmlFor="share-workouts" className="text-base font-medium">
              Share Workout Data
            </Label>
            <p className="text-sm text-muted-foreground">
              {shareWorkoutStats ? 'Your workouts are visible' : 'Your workouts are private'}
            </p>
          </div>
          <Switch
            id="share-workouts"
            checked={shareWorkoutStats}
            onCheckedChange={toggleWorkoutSharing}
            disabled={updating}
          />
        </div>

        {/* Visibility Options */}
        {shareWorkoutStats && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Who can see your workouts?</Label>
            
            <RadioGroup
              value={workoutVisibility}
              onValueChange={(value) => updateVisibility(value as WorkoutVisibility)}
              disabled={updating}
              className="space-y-3"
            >
              {/* Private */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="private" id="private" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="private" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Private
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Only you can see your workouts. Others won't see any activity.
                  </p>
                </div>
              </div>

              {/* Followers Only */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="followers" id="followers" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="followers" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Users className="h-4 w-4 text-blue-500" />
                    Followers Only
                    <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">Recommended</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Only users following you can see your workouts and activity.
                  </p>
                </div>
              </div>

              {/* Public */}
              <div className="flex items-start space-x-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                <RadioGroupItem value="public" id="public" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer font-medium">
                    <Globe className="h-4 w-4 text-green-500" />
                    Public
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Anyone can see your workouts and activity on your profile.
                  </p>
                </div>
              </div>
            </RadioGroup>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {workoutVisibility === 'private' && 'Your workout data is completely private. Change to "Followers Only" or "Public" to share with others.'}
                {workoutVisibility === 'followers' && 'Your workouts are visible to followers only. This provides a good balance between privacy and community engagement.'}
                {workoutVisibility === 'public' && 'Your workouts are public. Anyone can view your activity, great for coaches and influencers!'}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!shareWorkoutStats && (
          <Alert>
            <EyeOff className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Workout sharing is currently disabled. Enable it above to choose who can see your activity.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
