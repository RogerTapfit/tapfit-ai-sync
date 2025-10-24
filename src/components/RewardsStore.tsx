import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Coins, ShoppingCart, History, Zap, Palette, Trophy, Package } from 'lucide-react';
import { useTapCoins } from '@/hooks/useTapCoins';

interface RewardsStoreProps {
  onClose: () => void;
}

export const RewardsStore = ({ onClose }: RewardsStoreProps) => {
  const { balance, storeItems, transactions, purchases, purchaseItem, hasPurchased, loading } = useTapCoins();
  const [activeTab, setActiveTab] = useState('store');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ability': return <Zap className="h-4 w-4" />;
      case 'cosmetic': return <Palette className="h-4 w-4" />;
      case 'entry': return <Trophy className="h-4 w-4" />;
      case 'digital': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ability': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'cosmetic': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'entry': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'digital': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredItems = storeItems.filter(item => 
    !item.category.startsWith('avatar_') && (
      activeTab === 'store' || 
      (activeTab === 'abilities' && item.category === 'ability') ||
      (activeTab === 'cosmetics' && item.category === 'cosmetic') ||
      (activeTab === 'entries' && item.category === 'entry') ||
      (activeTab === 'digital' && item.category === 'digital')
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Rewards Store</h1>
              <p className="text-muted-foreground">Spend your Tap Coins on awesome rewards</p>
            </div>
          </div>
          <Card className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-400" />
              <span className="font-bold text-lg">{balance.toLocaleString()}</span>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="store" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              All Items
            </TabsTrigger>
            <TabsTrigger value="abilities" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Abilities
            </TabsTrigger>
            <TabsTrigger value="cosmetics" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Cosmetics
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden bg-card/50 backdrop-blur border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge className={getCategoryColor(item.category)}>
                          {getCategoryIcon(item.category)}
                          <span className="ml-1 capitalize">{item.category}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Coins className="h-4 w-4" />
                        <span className="font-bold">{item.coin_cost}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    <Button 
                      className="w-full"
                      onClick={() => purchaseItem(item.id)}
                      disabled={balance < item.coin_cost || hasPurchased(item.id) || loading}
                      variant={hasPurchased(item.id) ? "secondary" : "default"}
                    >
                      {hasPurchased(item.id) ? 'Purchased' : 
                       balance < item.coin_cost ? 'Insufficient Coins' : 'Purchase'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="abilities" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeItems.filter(item => item.category === 'ability').map((item) => (
                <Card key={item.id} className="overflow-hidden bg-blue-500/10 backdrop-blur border-blue-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                          <Zap className="h-3 w-3 mr-1" />
                          Ability
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Coins className="h-4 w-4" />
                        <span className="font-bold">{item.coin_cost}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    <Button 
                      className="w-full"
                      onClick={() => purchaseItem(item.id)}
                      disabled={balance < item.coin_cost || hasPurchased(item.id) || loading}
                      variant={hasPurchased(item.id) ? "secondary" : "default"}
                    >
                      {hasPurchased(item.id) ? 'Purchased' : 
                       balance < item.coin_cost ? 'Insufficient Coins' : 'Purchase'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cosmetics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeItems.filter(item => item.category === 'cosmetic').map((item) => (
                <Card key={item.id} className="overflow-hidden bg-purple-500/10 backdrop-blur border-purple-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{item.name}</CardTitle>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                          <Palette className="h-3 w-3 mr-1" />
                          Cosmetic
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Coins className="h-4 w-4" />
                        <span className="font-bold">{item.coin_cost}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    <Button 
                      className="w-full"
                      onClick={() => purchaseItem(item.id)}
                      disabled={balance < item.coin_cost || hasPurchased(item.id) || loading}
                      variant={hasPurchased(item.id) ? "secondary" : "default"}
                    >
                      {hasPurchased(item.id) ? 'Purchased' : 
                       balance < item.coin_cost ? 'Insufficient Coins' : 'Purchase'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 ${transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          <Coins className="h-4 w-4" />
                          <span className="font-bold">
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Your Purchases</h3>
                <div className="space-y-2">
                  {purchases.map((purchase) => (
                    <Card key={purchase.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{purchase.store_items.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(purchase.purchased_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-red-400">
                          <Coins className="h-4 w-4" />
                          <span className="font-bold">-{purchase.coins_spent}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};