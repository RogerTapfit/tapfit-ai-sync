import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Swords, Coins, AlertCircle } from 'lucide-react';
import { useFriendChallenges } from '@/hooks/useFriendChallenges';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChallengeUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUsername: string;
}

const CHALLENGE_TYPES = [
  { value: 'run_distance', label: '🏃 Run Distance', unit: 'km' },
  { value: 'walk_distance', label: '🚶 Walk Distance', unit: 'km' },
  { value: 'swim_distance', label: '🏊 Swim Distance', unit: 'm' },
  { value: 'run_time', label: '🏃 Run Time', unit: 'min' },
  { value: 'walk_time', label: '🚶 Walk Time', unit: 'min' },
  { value: 'swim_time', label: '🏊 Swim Time', unit: 'min' },
  { value: 'total_workouts', label: '💪 Total Workouts', unit: 'workouts' }
];

const TIME_LIMITS = [
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' }
];

export const ChallengeUserModal = ({ isOpen, onClose, targetUserId, targetUsername }: ChallengeUserModalProps) => {
  const [challengeType, setChallengeType] = useState('run_distance');
  const [targetValue, setTargetValue] = useState('5');
  const [timeLimitDays, setTimeLimitDays] = useState(7);
  const [message, setMessage] = useState('');
  const [coinReward, setCoinReward] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [userBalance, setUserBalance] = useState<number | null>(null);

  const { createChallenge } = useFriendChallenges();

  const selectedType = CHALLENGE_TYPES.find(t => t.value === challengeType);
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
    if (!targetValue || parseFloat(targetValue) <= 0) return;
    
    if (hasInsufficientFunds) {
      toast.error(`You need ${coinReward} coins to wager. Current balance: ${userBalance}`);
      return;
    }

    setSubmitting(true);
    const success = await createChallenge(
      targetUserId,
      challengeType,
      parseFloat(targetValue),
      selectedType?.unit || 'km',
      timeLimitDays,
      message || undefined,
      coinReward
    );

    setSubmitting(false);
    if (success) {
      onClose();
      // Reset form
      setChallengeType('run_distance');
      setTargetValue('5');
      setTimeLimitDays(7);
      setMessage('');
      setCoinReward(50);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Challenge @{targetUsername}
          </DialogTitle>
          <DialogDescription>
            Create a friendly fitness challenge and compete!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Challenge Type */}
          <div className="space-y-2">
            <Label>Challenge Type</Label>
            <Select value={challengeType} onValueChange={setChallengeType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHALLENGE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Value */}
          <div className="space-y-2">
            <Label>Target ({selectedType?.unit})</Label>
            <Input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder={`Enter target ${selectedType?.unit}`}
              min="1"
            />
            <p className="text-xs text-muted-foreground">
              First to reach {targetValue} {selectedType?.unit} wins!
            </p>
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <Label>Time Limit</Label>
            <Select value={timeLimitDays.toString()} onValueChange={(v) => setTimeLimitDays(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_LIMITS.map(limit => (
                  <SelectItem key={limit.value} value={limit.value.toString()}>
                    {limit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <SelectItem value="25">25 coins</SelectItem>
                <SelectItem value="50">50 coins</SelectItem>
                <SelectItem value="100">100 coins</SelectItem>
                <SelectItem value="250">250 coins</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Winner takes {coinReward * 2} coins (your stake + opponent's stake)
            </p>
            {userBalance !== null && (
              <p className={`text-xs ${hasInsufficientFunds ? 'text-destructive' : 'text-muted-foreground'}`}>
                Your balance: {userBalance} coins
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
            <Label>Trash Talk (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Think you can beat me? 😏"
              maxLength={200}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !targetValue || hasInsufficientFunds}>
            {submitting ? 'Sending...' : `Wager ${coinReward} Coins`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
