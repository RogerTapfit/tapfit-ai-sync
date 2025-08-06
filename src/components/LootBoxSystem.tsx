import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gift, Zap, Star } from 'lucide-react';
import { useLootBoxes } from '@/hooks/useLootBoxes';
import { useTapTokens } from '@/hooks/useTapTokens';
import { useToast } from '@/hooks/use-toast';

interface LootBoxSystemProps {
  onClose: () => void;
}

interface RewardDisplayProps {
  rewards: any[];
  onClose: () => void;
}

const RewardDisplay = ({ rewards, onClose }: RewardDisplayProps) => {
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-yellow-600 text-white';
      case 'epic': return 'from-purple-400 to-purple-600 text-white';
      case 'rare': return 'from-blue-400 to-blue-600 text-white';
      default: return 'from-gray-400 to-gray-600 text-white';
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'chassis': return '🤖';
      case 'tech_module': return '⚙️';
      case 'color_scheme': return '🎨';
      case 'power_up': return '⚡';
      case 'tokens': return '💎';
      case 'coins': return '🪙';
      default: return '🎁';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl animate-scale-in">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Gift className="w-6 h-6 text-primary" />
            Loot Box Opened!
          </CardTitle>
          <CardDescription>You received the following rewards:</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward, index) => (
              <Card key={index} className="p-4 text-center animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="text-4xl mb-2">{getRewardIcon(reward.type)}</div>
                <h3 className="font-semibold">{reward.name}</h3>
                {reward.description && (
                  <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                )}
                <Badge 
                  className={`mt-2 bg-gradient-to-r ${getRarityColor(reward.rarity)}`}
                >
                  {reward.rarity.charAt(0).toUpperCase() + reward.rarity.slice(1)}
                </Badge>
                {typeof reward.value === 'number' && (
                  <p className="text-lg font-mono mt-2">+{reward.value}</p>
                )}
              </Card>
            ))}
          </div>
          
          <div className="flex justify-center pt-4">
            <Button onClick={onClose} className="px-8">
              Awesome! Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const LootBoxSystem = ({ onClose }: LootBoxSystemProps) => {
  const { lootBoxes, userOpenings, loading, opening, openLootBox } = useLootBoxes();
  const { tokenBalance } = useTapTokens();
  const [openedRewards, setOpenedRewards] = useState<any[] | null>(null);
  const { toast } = useToast();

  const handleOpenLootBox = async (lootBoxId: string) => {
    const rewards = await openLootBox(lootBoxId);
    if (rewards) {
      setOpenedRewards(rewards);
    }
  };

  const getRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-yellow-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400 shadow-yellow-400/20';
      case 'epic': return 'border-purple-400 shadow-purple-400/20';
      case 'rare': return 'border-blue-400 shadow-blue-400/20';
      default: return 'border-gray-400 shadow-gray-400/20';
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  TapFit Loot Boxes
                </CardTitle>
                <CardDescription>
                  Open loot boxes to get rare robot parts, tech modules, and power-ups!
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={onClose}>
                ✕
              </Button>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" />
                <span className="text-sm">TapTokens: {tokenBalance}</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-green-400" />
                <span className="text-sm">Boxes Opened: {userOpenings.length}</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Available Loot Boxes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Available Loot Boxes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lootBoxes.map((lootBox) => (
                  <Card 
                    key={lootBox.id} 
                    className={`relative overflow-hidden border-2 ${getRarityBorder(lootBox.rarity_tier)} shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${getRarityGradient(lootBox.rarity_tier)}`} />
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{lootBox.name}</CardTitle>
                        <Badge 
                          className={`bg-gradient-to-r ${getRarityGradient(lootBox.rarity_tier)} text-white`}
                        >
                          {lootBox.rarity_tier}
                        </Badge>
                      </div>
                      {lootBox.description && (
                        <CardDescription>{lootBox.description}</CardDescription>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Cost:</span>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-blue-400" />
                            <span className="font-mono">{lootBox.tap_token_cost}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Guaranteed:</span>
                            <span>{lootBox.guaranteed_rewards.length} items</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Possible:</span>
                            <span>{lootBox.possible_rewards.length} items</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleOpenLootBox(lootBox.id)}
                        disabled={opening || tokenBalance < lootBox.tap_token_cost}
                        className="w-full"
                        variant={tokenBalance >= lootBox.tap_token_cost ? "default" : "outline"}
                      >
                        {opening ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Opening...
                          </>
                        ) : tokenBalance >= lootBox.tap_token_cost ? (
                          <>
                            <Gift className="w-4 h-4 mr-2" />
                            Open Box
                          </>
                        ) : (
                          'Insufficient Tokens'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recent Openings */}
            {userOpenings.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Openings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto">
                  {userOpenings.slice(0, 10).map((opening) => {
                    const lootBox = lootBoxes.find(box => box.id === opening.loot_box_id);
                    return (
                      <Card key={opening.id} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {lootBox?.name || 'Unknown Box'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(opening.opened_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Rewards:</span>
                            <span>{opening.rewards_received.length} items</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Cost:</span>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-blue-400" />
                              <span>{opening.tokens_spent}</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {lootBoxes.length === 0 && (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Loot Boxes Available</h3>
                <p className="text-muted-foreground">
                  Check back later for new loot boxes with exciting rewards!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reward Display Modal */}
      {openedRewards && (
        <RewardDisplay 
          rewards={openedRewards} 
          onClose={() => setOpenedRewards(null)} 
        />
      )}
    </>
  );
};