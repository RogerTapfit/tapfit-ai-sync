import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AvatarDisplay } from './AvatarDisplay';
import { useAvatar } from '@/hooks/useAvatar';
import { useTapCoins } from '@/hooks/useTapCoins';
import { toast } from 'sonner';

interface AvatarShopProps {
  onClose: () => void;
}

export const AvatarShop = ({ onClose }: AvatarShopProps) => {
  const { avatarData, purchaseAvatarItem, canUseItem } = useAvatar();
  const { storeItems, balance } = useTapCoins();
  const [selectedCategory, setSelectedCategory] = useState('featured');

  if (!avatarData) return null;

  const avatarItems = storeItems.filter(item => 
    item.category.startsWith('avatar_')
  );

  const getItemsByCategory = (category: string) => {
    return avatarItems.filter(item => item.category === category);
  };

  const getFeaturedItems = () => {
    // Premium and high-value items
    return avatarItems.filter(item => item.coin_cost >= 100);
  };

  const handlePurchase = async (item: any) => {
    if (canUseItem(item.name, item.category)) {
      toast.info('You already own this item!');
      return;
    }

    if (balance >= item.coin_cost) {
      const categoryKey = item.category.replace('avatar_', '') as keyof typeof avatarData;
      const success = await purchaseAvatarItem(item.id, item.category, item.name.toLowerCase().replace(/\s+/g, '_'));
      if (success) {
        toast.success(`Purchased ${item.name}! It's now equipped.`);
      } else {
        toast.error('Purchase failed. Please try again.');
      }
    } else {
      toast.error(`You need ${item.coin_cost - balance} more Tap Coins!`);
    }
  };

  const getRarityColor = (cost: number) => {
    if (cost >= 400) return 'text-purple-500 border-purple-500'; // Legendary
    if (cost >= 200) return 'text-yellow-500 border-yellow-500'; // Epic
    if (cost >= 100) return 'text-blue-500 border-blue-500'; // Rare
    if (cost >= 50) return 'text-green-500 border-green-500'; // Uncommon
    return 'text-gray-500 border-gray-500'; // Common
  };

  const getRarityLabel = (cost: number) => {
    if (cost >= 400) return 'Legendary';
    if (cost >= 200) return 'Epic';
    if (cost >= 100) return 'Rare';
    if (cost >= 50) return 'Uncommon';
    return 'Common';
  };

  const ItemCard = ({ item }: { item: any }) => {
    const owned = canUseItem(item.name, item.category);
    const canAfford = balance >= item.coin_cost;
    const rarity = getRarityColor(item.coin_cost);
    const rarityLabel = getRarityLabel(item.coin_cost);

    return (
      <Card className={`glow-card hover:scale-105 transition-all duration-200 ${rarity.includes('purple') ? 'bg-gradient-to-br from-purple-500/5 to-pink-500/5' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-sm">{item.name}</CardTitle>
              <Badge variant="outline" className={`text-xs mt-1 ${rarity}`}>
                {rarityLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {owned ? (
                <span className="text-green-500 text-sm">Owned</span>
              ) : (
                <span className="font-bold text-sm">{item.coin_cost}</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
          <Button
            size="sm"
            className="w-full"
            variant={owned ? "outline" : canAfford ? "default" : "outline"}
            onClick={() => handlePurchase(item)}
            disabled={owned || (!canAfford && !owned)}
          >
            {owned ? (
              'Owned'
            ) : canAfford ? (
              'Purchase'
            ) : (
              `Need ${item.coin_cost - balance} coins`
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Avatar Shop
            </h1>
            <p className="text-muted-foreground">Customize your look with exclusive items</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-card p-3 rounded-lg">
              <span className="font-bold text-lg">{balance.toLocaleString()} Coins</span>
            </div>
            <Button variant="outline" onClick={onClose}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Avatar Preview */}
          <div className="lg:col-span-1">
            <Card className="glow-card p-6 sticky top-4">
              <CardHeader>
                <CardTitle className="text-center">Your Avatar</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AvatarDisplay 
                  avatarData={avatarData} 
                  size="large" 
                  showAnimation={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Shop Items */}
          <div className="lg:col-span-3">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="featured">
                  Featured
                </TabsTrigger>
                <TabsTrigger value="avatar_hair">Hair</TabsTrigger>
                <TabsTrigger value="avatar_outfit">Outfits</TabsTrigger>
                <TabsTrigger value="avatar_accessory">Gear</TabsTrigger>
                <TabsTrigger value="avatar_shoes">Shoes</TabsTrigger>
                <TabsTrigger value="avatar_animation">Effects</TabsTrigger>
              </TabsList>

              {/* Featured Items */}
              <TabsContent value="featured">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Premium Collection</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">Exclusive high-tier items for elite athletes</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getFeaturedItems().map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Category Items */}
              {['avatar_hair', 'avatar_outfit', 'avatar_accessory', 'avatar_shoes', 'avatar_animation'].map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {getItemsByCategory(category).map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};