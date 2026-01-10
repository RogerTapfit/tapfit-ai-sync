import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sprout, Coins, AlertCircle } from 'lucide-react';
import { useFriendChallenges } from '@/hooks/useFriendChallenges';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SobrietyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUsername: string;
}

const SOBRIETY_TYPES = [
  { value: 'sober_alcohol', label: '🍺 Alcohol-Free', substance: 'alcohol' },
  { value: 'sober_sugar', label: '🍬 Sugar-Free', substance: 'sugar' },
  { value: 'sober_caffeine', label: '☕ Caffeine-Free', substance: 'caffeine' },
  { value: 'sober_smoking', label: '🚬 Smoke-Free', substance: 'smoking' },
  { value: 'sober_cannabis', label: '🌿 Cannabis-Free', substance: 'cannabis' },
  { value: 'sober_social_media', label: '📱 Social Media Detox', substance: 'social_media' },
  { value: 'sober_general', label: '🌱 General Sobriety', substance: 'general' }
];

const DURATION_OPTIONS = [
  { value: 7, label: '7 days (1 week)' },
  { value: 14, label: '14 days (2 weeks)' },
  { value: 30, label: '30 days (1 month)' },
  { value: 60, label: '60 days (2 months)' },
  { value: 90, label: '90 days (3 months)' }
];

const COIN_OPTIONS = [
  { value: 25, label: '25 coins' },
  { value: 50, label: '50 coins' },
  { value: 100, label: '100 coins' },
  { value: 250, label: '250 coins' },
  { value: 500, label: '500 coins' }
];

export const SobrietyChallengeModal = ({ isOpen, onClose, targetUserId, targetUsername }: SobrietyChallengeModalProps) => {
  const [challengeType, setChallengeType] = useState('sober_alcohol');
  const [targetDays, setTargetDays] = useState(7);
  const [message, setMessage] = useState('');
  const [coinReward, setCoinReward] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  const { createChallenge } = useFriendChallenges();

  const selectedType = SOBRIETY_TYPES.find(t => t.value === challengeType);
  const hasInsufficientFunds = userBalance !== null && userBalance < coinReward;

  // Fetch user's coin balance when modal opens
  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tap_coins_balance')
          .eq('id', user.id)
          .single();
        setUserBalance(profile?.tap_coins_balance ?? 0);
      }
    };
    if (isOpen) {
      fetchBalance();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (hasInsufficientFunds) {
      toast.error(`You need ${coinReward} coins to wager. Current balance: ${userBalance}`);
      return;
    }

    setSubmitting(true);
    const success = await createChallenge(
      targetUserId,
      challengeType,
      targetDays,
      'days',
      targetDays, // time limit matches target
      message || `Let's both stay ${selectedType?.label.split(' ')[1] || 'sober'} for ${targetDays} days! 💪`,
      coinReward
    );

    setSubmitting(false);
    if (success) {
      onClose();
      // Reset form
      setChallengeType('sober_alcohol');
      setTargetDays(7);
      setMessage('');
      setCoinReward(50);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-emerald-500" />
            Sobriety Challenge
          </DialogTitle>
          <DialogDescription>
            Challenge @{targetUsername} to a sobriety journey together!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sobriety Type */}
          <div className="space-y-2">
            <Label>What to Avoid</Label>
            <Select value={challengeType} onValueChange={setChallengeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOBRIETY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={targetDays.toString()} onValueChange={(v) => setTargetDays(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              First to complete {targetDays} consecutive sober days wins!
            </p>
          </div>

          {/* Coin Wager */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              Coin Wager (each player)
            </Label>
            <Select value={coinReward.toString()} onValueChange={(v) => setCoinReward(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COIN_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Winner takes {coinReward * 2} coins (your stake + opponent's stake)
            </p>
            {userBalance !== null && (
              <p className={`text-xs ${hasInsufficientFunds ? 'text-destructive' : 'text-muted-foreground'}`}>
                Your balance: {userBalance.toLocaleString()} coins
                {hasInsufficientFunds && (
                  <span className="flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    Insufficient funds for this wager
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Motivational Message (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Let's do this together! We've got this 💪"
              maxLength={200}
            />
          </div>

          {/* Info Card */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              <strong>How it works:</strong> Both players check in daily using the Sobriety Tracker. 
              Your progress automatically syncs. First to reach {targetDays} days wins!
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || hasInsufficientFunds}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? 'Sending...' : `Challenge for ${coinReward} Coins`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
