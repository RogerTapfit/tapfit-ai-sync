import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Swords, Clock, Trophy, Coins, Check, X } from 'lucide-react';
import { FriendChallenge, useFriendChallenges } from '@/hooks/useFriendChallenges';
import { useNavigate } from 'react-router-dom';

interface FriendChallengeCardProps {
  challenge: FriendChallenge;
  currentUserId: string;
  onAction?: () => void;
}

export const FriendChallengeCard = ({ challenge, currentUserId, onAction }: FriendChallengeCardProps) => {
  const navigate = useNavigate();
  const { acceptChallenge, declineChallenge, getChallengeTypeLabel } = useFriendChallenges();

  const isChallenger = challenge.challenger_id === currentUserId;
  const opponent = isChallenger ? challenge.challenged : challenge.challenger;
  const myProgress = isChallenger ? challenge.challenger_progress : challenge.challenged_progress;
  const opponentProgress = isChallenger ? challenge.challenged_progress : challenge.challenger_progress;
  const progressPercent = Math.min((myProgress / challenge.target_value) * 100, 100);
  const opponentProgressPercent = Math.min((opponentProgress / challenge.target_value) * 100, 100);

  const handleAccept = async () => {
    await acceptChallenge(challenge.id);
    onAction?.();
  };

  const handleDecline = async () => {
    await declineChallenge(challenge.id);
    onAction?.();
  };

  const handleProfileClick = () => {
    if (opponent?.username) {
      navigate(`/profile/${opponent.username}`);
    }
  };

  const getStatusBadge = () => {
    switch (challenge.status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">Pending</Badge>;
      case 'active':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Active</Badge>;
      case 'completed':
        const isWinner = challenge.winner_id === currentUserId;
        return <Badge variant="secondary" className={isWinner ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}>
          {isWinner ? 'Won!' : 'Lost'}
        </Badge>;
      case 'declined':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Declined</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Expired</Badge>;
      default:
        return null;
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Opponent Avatar */}
          <Avatar 
            className="h-10 w-10 cursor-pointer flex-shrink-0" 
            onClick={handleProfileClick}
          >
            {opponent?.avatar_url ? (
              <AvatarImage src={opponent.avatar_url} alt={opponent.username || 'User'} />
            ) : null}
            <AvatarFallback>
              {getInitials(opponent?.full_name || opponent?.username)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Swords className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">
                {isChallenger ? 'You challenged' : 'Challenged by'} @{opponent?.username || 'Unknown'}
              </span>
              {getStatusBadge()}
            </div>

            {/* Challenge Details */}
            <div className="bg-muted/50 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{getChallengeTypeLabel(challenge.challenge_type)}</span>
                <span className="text-sm text-muted-foreground">
                  {challenge.target_value} {challenge.target_unit}
                </span>
              </div>
              
              {challenge.message && (
                <p className="text-sm text-muted-foreground italic mt-2">"{challenge.message}"</p>
              )}
            </div>

            {/* Progress (for active challenges) */}
            {challenge.status === 'active' && (
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs">
                  <span>Your progress</span>
                  <span>
                    {challenge.challenge_type.startsWith('sober_') 
                      ? `Day ${myProgress} of ${challenge.target_value}`
                      : `${myProgress} / ${challenge.target_value} ${challenge.target_unit}`
                    }
                  </span>
                </div>
                <Progress 
                  value={progressPercent} 
                  className={`h-2 ${challenge.challenge_type.startsWith('sober_') ? '[&>div]:bg-emerald-500' : ''}`} 
                />
                
                <div className="flex items-center justify-between text-xs mt-2">
                  <span>@{opponent?.username}'s progress</span>
                  <span>
                    {challenge.challenge_type.startsWith('sober_') 
                      ? `Day ${opponentProgress} of ${challenge.target_value}`
                      : `${opponentProgress} / ${challenge.target_value} ${challenge.target_unit}`
                    }
                  </span>
                </div>
                <Progress value={opponentProgressPercent} className="h-2 bg-muted [&>div]:bg-orange-500" />
              </div>
            )}

            {/* Footer Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {challenge.status === 'active' && challenge.ends_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Ends {formatDistanceToNow(new Date(challenge.ends_at), { addSuffix: true })}</span>
                </div>
              )}
              {challenge.status === 'pending' && (
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-yellow-500" />
                  <span>Wager: {challenge.coin_reward} coins each</span>
                </div>
              )}
              {challenge.status === 'active' && (
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-yellow-500" />
                  <span>Pot: {challenge.coin_reward * 2} coins</span>
                </div>
              )}
              {challenge.status === 'completed' && challenge.winner_id === currentUserId && (
                <div className="flex items-center gap-1 text-green-600">
                  <Trophy className="h-3 w-3" />
                  <span>Won {challenge.coin_reward * 2} coins!</span>
                </div>
              )}
              {challenge.status === 'completed' && challenge.winner_id && challenge.winner_id !== currentUserId && (
                <div className="flex items-center gap-1 text-destructive">
                  <Coins className="h-3 w-3" />
                  <span>Lost {challenge.coin_reward} coins</span>
                </div>
              )}
            </div>

            {/* Action Buttons (for pending challenges you received) */}
            {challenge.status === 'pending' && !isChallenger && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleAccept} className="flex-1">
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button size="sm" variant="outline" onClick={handleDecline} className="flex-1">
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}

            {/* Waiting message for sent challenges */}
            {challenge.status === 'pending' && isChallenger && (
              <p className="text-xs text-muted-foreground mt-2">
                Waiting for @{opponent?.username} to respond...
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
