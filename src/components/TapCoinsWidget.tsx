import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Coins, ChevronRight } from 'lucide-react';
import { useTapCoins } from '@/hooks/useTapCoins';
import { RewardsStore } from './RewardsStore';

export const TapCoinsWidget = () => {
  const [showStore, setShowStore] = useState(false);
  const { balance, loading } = useTapCoins();

  if (showStore) {
    return <RewardsStore onClose={() => setShowStore(false)} />;
  }

  return (
    <Card 
      className="p-4 cursor-pointer hover-scale transition-all duration-200 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30"
      onClick={() => setShowStore(true)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
            <Coins className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Tap Coins</p>
            <p className="text-xl font-bold text-foreground">
              {loading ? '...' : balance.toLocaleString()}
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Card>
  );
};