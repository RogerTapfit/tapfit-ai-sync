import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RobotAvatarDisplay } from '@/components/RobotAvatarDisplay';
import { ProfilePhotoUpload } from '@/components/social/ProfilePhotoUpload';
import { CharacterSelector } from '@/components/CharacterSelector';
import { useRobotAvatar } from '@/hooks/useRobotAvatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Badge } from '@/components/ui/badge';
import { getDisplayName } from '@/lib/userDisplay';
import { useCoachEncouragement } from '@/hooks/useCoachEncouragement';
import { usePageContext } from '@/hooks/usePageContext';

export default function ProfileCustomization() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { avatarData, loading: avatarLoading, updateAvatar } = useRobotAvatar();
  const { handleCoachClick, isSpeaking, canSpeak } = useCoachEncouragement();

  // Register page context for chatbot
  usePageContext({
    pageName: 'Profile Customization',
    pageDescription: 'Customize your profile photo, select your AI coach character, and manage account settings',
    visibleContent: profile ? `Customizing profile for ${profile.username || profile.full_name}. Change profile photo, select coach character, and preview public profile appearance.` : 'Loading profile settings...'
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUser(user);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Refresh profile data to ensure it's saved
      await loadUserData();
      toast.success('Profile saved successfully!');
      navigate('/social');
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return profile?.username?.[0]?.toUpperCase() || 'U';
  };

  if (loading || avatarLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Customize Profile</h1>
            <p className="text-sm text-muted-foreground">
              Update your profile photo and coach avatar
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <LoadingSpinner />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Side - Customization */}
        <div className="space-y-6">
          <Tabs defaultValue="photo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="photo">Profile Photo</TabsTrigger>
              <TabsTrigger value="coach">Coach Avatar</TabsTrigger>
            </TabsList>

            <TabsContent value="photo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload or change your profile picture
                  </p>
                </CardHeader>
                <CardContent>
                  <ProfilePhotoUpload
                    currentAvatarUrl={profile?.avatar_url}
                    username={profile?.username}
                    onUploadSuccess={loadUserData}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coach" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Select Your Coach Avatar</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose the coach that will motivate you through your fitness journey
                  </p>
                </CardHeader>
                <CardContent>
                  <CharacterSelector 
                    selectedCharacter={avatarData?.character_type}
                    onCharacterSelect={async (characterId) => {
                      console.log('🎯 Coach avatar selected:', characterId);
                      const success = await updateAvatar({ character_type: characterId });
                      if (success) {
                        console.log('✅ Coach selection saved');
                        toast.success('Coach selected!');
                      } else {
                        console.error('❌ Failed to save coach selection');
                        toast.error('Failed to save coach selection');
                      }
                    }}
                    onPreview={(characterId) => {
                      console.log('👁️ Previewing coach:', characterId);
                      // Just update local state for preview, don't save yet
                      updateAvatar({ character_type: characterId });
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side - Live Preview */}
        <div className="space-y-6">
          <Card className="sticky top-4 border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <CardTitle>Live Preview</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                How your profile appears to others
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Header Preview */}
              <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 bg-muted/20">
                <div className="flex flex-col items-center gap-4">
                  {/* Dual Avatar Display */}
                  <div className="flex gap-4 items-start">
                    {/* User Profile Photo */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">You</span>
                      <Avatar className="h-20 w-20 ring-2 ring-red-500/10">
                        <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.username || 'User'} />
                        <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Coach/Robot Avatar */}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium">Coach</span>
                      {avatarData ? (
                        <div className="w-20">
                          <RobotAvatarDisplay
                            avatarData={avatarData}
                            size="small"
                            showAnimation={true}
                            onClick={handleCoachClick}
                            isClickable={canSpeak}
                            isSpeaking={isSpeaking}
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
                          <span className="text-xs text-muted-foreground text-center px-2">No coach</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="text-center">
                    <h2 className="text-xl font-bold">
                      {getDisplayName(user, profile) || profile?.username || 'User'}
                    </h2>
                    {profile?.username && (
                      <p className="text-sm text-muted-foreground">
                        @<span className="text-red-500">{profile.username}</span>
                      </p>
                    )}
                    {profile?.bio && (
                      <p className="text-sm mt-2">{profile.bio}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 mt-2">
                    <div className="text-center">
                      <div className="font-bold text-lg">0</div>
                      <div className="text-xs text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">0</div>
                      <div className="text-xs text-muted-foreground">Following</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg text-red-500">0</div>
                      <div className="text-xs text-muted-foreground">Workouts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Card Preview */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Search Result Preview</h3>
                <div className="rounded-lg border p-4 bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    {/* Dual Avatar Display - Compact */}
                    <div className="flex gap-2 items-center">
                      <div className="flex flex-col items-center gap-1">
                        <Avatar className="h-10 w-10 ring-1 ring-red-500/10">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] text-muted-foreground">You</span>
                      </div>
                      
                      <div className="flex flex-col items-center gap-1">
                        {avatarData ? (
                          <div className="w-10">
                            <RobotAvatarDisplay
                              avatarData={avatarData}
                              size="small"
                              showAnimation={false}
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded border border-dashed border-muted-foreground/20 flex items-center justify-center bg-muted/10">
                            <span className="text-[8px] text-muted-foreground">?</span>
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground">Coach</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">
                        {getDisplayName(user, profile) || profile?.username || 'User'}
                      </div>
                      {profile?.username && (
                        <div className="text-xs text-muted-foreground truncate">
                          @{profile.username}
                        </div>
                      )}
                      {profile?.bio && (
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {profile.bio}
                        </div>
                      )}
                      <div className="mt-1.5">
                        <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500 h-5">
                          <span>Followers</span>
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-2 text-blue-500">💡 Tips</h3>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Use a clear, well-lit photo for your profile picture</li>
                  <li>• Customize your coach avatar to match your personality</li>
                  <li>• Changes update in real-time across the app</li>
                  <li>• Click "Save Changes" when you're happy with your profile</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
