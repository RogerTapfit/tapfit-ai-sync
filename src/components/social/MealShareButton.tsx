import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Share2, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { mealSharingService, MealShareVisibility } from '@/services/mealSharingService';
import { FoodEntry, AlcoholEntry } from '@/hooks/useNutrition';
import { getBestThumbnailUrl } from '@/utils/photoUtils';

interface MealShareButtonProps {
  entryId: string;
  entryType: 'food' | 'alcohol';
  entryData: FoodEntry | AlcoholEntry;
  isShared?: boolean;
  activityId?: string;
  onShareChange?: (shared: boolean) => void;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const MealShareButton = ({
  entryId,
  entryType,
  entryData,
  isShared: initialShared = false,
  activityId,
  onShareChange,
  size = 'sm',
  variant = 'ghost'
}: MealShareButtonProps) => {
  const [showDialog, setShowDialog] = useState(false);
  const [caption, setCaption] = useState('');
  const [visibility, setVisibility] = useState<MealShareVisibility>('followers');
  const [loading, setLoading] = useState(false);
  const [isShared, setIsShared] = useState(initialShared);

  const handleShare = async () => {
    setLoading(true);
    try {
      const activity = await mealSharingService.shareMealToFeed({
        entryId,
        entryType,
        caption,
        visibility
      });

      if (activity) {
        toast.success('Meal shared to your feed!');
        setIsShared(true);
        setShowDialog(false);
        onShareChange?.(true);
      } else {
        toast.error('Failed to share meal');
      }
    } catch (error) {
      console.error('Error sharing meal:', error);
      toast.error('Failed to share meal');
    } finally {
      setLoading(false);
    }
  };

  const handleUnshare = async () => {
    if (!activityId) return;
    
    setLoading(true);
    try {
      const success = await mealSharingService.unshareMeal(activityId);
      if (success) {
        toast.success('Meal removed from feed');
        setIsShared(false);
        onShareChange?.(false);
      } else {
        toast.error('Failed to remove meal');
      }
    } catch (error) {
      console.error('Error unsharing meal:', error);
      toast.error('Failed to remove meal');
    } finally {
      setLoading(false);
    }
  };

  const photoUrl = getBestThumbnailUrl(entryData);

  const getMealSummary = () => {
    if (entryType === 'food') {
      const food = entryData as FoodEntry;
      return `${food.total_calories} cal • ${food.total_protein.toFixed(0)}g protein`;
    } else {
      const alcohol = entryData as AlcoholEntry;
      return `${alcohol.drink_type} • ${alcohol.alcohol_content}% ABV`;
    }
  };

  if (isShared) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleUnshare}
        disabled={loading}
        className="gap-2 text-green-600 border-green-600"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        Shared
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowDialog(true)}
      >
        <Share2 className="h-4 w-4" />
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Meal to Feed</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            <div className="border rounded-lg p-3 bg-muted/30">
              <div className="flex gap-3">
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt="Meal preview"
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {entryType === 'food'
                      ? (entryData as FoodEntry).food_items?.[0]?.name || 'Meal'
                      : (entryData as AlcoholEntry).drink_type}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getMealSummary()}
                  </p>
                </div>
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Textarea
                id="caption"
                placeholder="Add a note about this meal..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
              />
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label>Who can see this?</Label>
              <RadioGroup value={visibility} onValueChange={(v) => setVisibility(v as MealShareVisibility)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="followers" id="followers" />
                  <Label htmlFor="followers" className="cursor-pointer">
                    Followers only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="cursor-pointer">
                    Public (everyone)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="cursor-pointer">
                    Private (only me)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share to Feed
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
