import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AvatarDisplay } from './AvatarDisplay';
import { useAvatar, AvatarData } from '@/hooks/useAvatar';
import { useTapCoins } from '@/hooks/useTapCoins';
import { toast } from 'sonner';

interface AvatarCustomizerProps {
  onClose: () => void;
}

export const AvatarCustomizer = ({ onClose }: AvatarCustomizerProps) => {
  const { avatarData, updateAvatar, purchaseAvatarItem, canUseItem } = useAvatar();
  const { storeItems, balance } = useTapCoins();
  const [previewData, setPreviewData] = useState<AvatarData | null>(avatarData);

  if (!avatarData || !previewData) return null;

  const avatarItems = storeItems.filter(item => 
    item.category.startsWith('avatar_')
  );

  const getItemsByCategory = (category: string) => {
    return avatarItems.filter(item => item.category === category);
  };

  const handleItemSelect = async (item: any, categoryKey: string) => {
    const itemValue = item.name.toLowerCase().replace(/\s+/g, '_');
    
    if (canUseItem(item.name, item.category)) {
      // User owns this item, apply it immediately
      const newData = { ...previewData, [categoryKey]: itemValue };
      setPreviewData(newData);
      await updateAvatar({ [categoryKey]: itemValue });
      toast.success(`Applied ${item.name}!`);
    } else {
      // User needs to purchase this item
      if (balance >= item.coin_cost) {
        const success = await purchaseAvatarItem(item.id, item.category, itemValue);
        if (success) {
          const newData = { ...previewData, [categoryKey]: itemValue };
          setPreviewData(newData);
          toast.success(`Purchased and equipped ${item.name}!`);
        } else {
          toast.error('Purchase failed. Please try again.');
        }
      } else {
        toast.error(`You need ${item.coin_cost - balance} more Tap Coins!`);
      }
    }
  };

  const basicOptions = {
    skin_tone: [
      { name: 'Light', value: 'light' },
      { name: 'Medium', value: 'medium' },
      { name: 'Tan', value: 'tan' },
      { name: 'Dark', value: 'dark' }
    ],
    hair_color: [
      { name: 'Brown', value: 'brown' },
      { name: 'Black', value: 'black' },
      { name: 'Blonde', value: 'blonde' },
      { name: 'Red', value: 'red' },
      { name: 'Gray', value: 'gray' }
    ],
    eye_color: [
      { name: 'Brown', value: 'brown' },
      { name: 'Blue', value: 'blue' },
      { name: 'Green', value: 'green' },
      { name: 'Hazel', value: 'hazel' }
    ]
  };

  const handleBasicOption = async (category: string, value: string) => {
    const newData = { ...previewData, [category]: value };
    setPreviewData(newData);
    await updateAvatar({ [category]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose}>
              
            </Button>
            <h1 className="text-2xl font-bold">Avatar Customizer</h1>
          </div>
          <div className="flex items-center gap-2">
            
            <span className="font-bold text-lg">{balance.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Preview */}
          <div className="lg:col-span-1">
            <Card className="glow-card p-6">
              <CardHeader>
                <CardTitle className="text-center">Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AvatarDisplay 
                  avatarData={previewData} 
                  size="large" 
                  showAnimation={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Customization Options */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="basic" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="hair">Hair</TabsTrigger>
                <TabsTrigger value="outfits">Outfits</TabsTrigger>
                <TabsTrigger value="accessories">Gear</TabsTrigger>
                <TabsTrigger value="extras">Extras</TabsTrigger>
              </TabsList>

              {/* Basic Options (Free) */}
              <TabsContent value="basic">
                <Card className="glow-card">
                  <CardHeader>
                    <CardTitle>Basic Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(basicOptions).map(([category, options]) => (
                      <div key={category}>
                        <h4 className="font-semibold mb-3 capitalize">
                          {category.replace('_', ' ')}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {options.map((option) => (
                            <Button
                              key={option.value}
                              variant={previewData[category as keyof AvatarData] === option.value ? "default" : "outline"}
                              className="h-auto p-3"
                              onClick={() => handleBasicOption(category, option.value)}
                            >
                              {option.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Hair Styles */}
              <TabsContent value="hair">
                <Card className="glow-card">
                  <CardHeader>
                    <CardTitle>Hair Styles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getItemsByCategory('avatar_hair').map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{item.name}</h4>
                            <div className="flex items-center gap-2">
                              {canUseItem(item.name, item.category) ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <>
                                  <Coins className="h-4 w-4 text-yellow-500" />
                                  <span className="font-bold">{item.coin_cost}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                          <Button
                            className="w-full"
                            variant={canUseItem(item.name, item.category) ? "default" : "outline"}
                            onClick={() => handleItemSelect(item, 'hair_style')}
                            disabled={!canUseItem(item.name, item.category) && balance < item.coin_cost}
                          >
                            {canUseItem(item.name, item.category) ? 'Equip' : 
                             balance >= item.coin_cost ? 'Purchase' : (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Need {item.coin_cost - balance} more coins
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Outfits */}
              <TabsContent value="outfits">
                <Card className="glow-card">
                  <CardHeader>
                    <CardTitle>Outfits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getItemsByCategory('avatar_outfit').map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold">{item.name}</h4>
                            <div className="flex items-center gap-2">
                              {canUseItem(item.name, item.category) ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <>
                                  <Coins className="h-4 w-4 text-yellow-500" />
                                  <span className="font-bold">{item.coin_cost}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                          <Button
                            className="w-full"
                            variant={canUseItem(item.name, item.category) ? "default" : "outline"}
                            onClick={() => handleItemSelect(item, 'outfit')}
                            disabled={!canUseItem(item.name, item.category) && balance < item.coin_cost}
                          >
                            {canUseItem(item.name, item.category) ? 'Equip' : 
                             balance >= item.coin_cost ? 'Purchase' : (
                              <>
                                <Lock className="h-4 w-4 mr-2" />
                                Need {item.coin_cost - balance} more coins
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Accessories & Shoes */}
              <TabsContent value="accessories">
                <div className="space-y-6">
                  <Card className="glow-card">
                    <CardHeader>
                      <CardTitle>Accessories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getItemsByCategory('avatar_accessory').map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{item.name}</h4>
                              <div className="flex items-center gap-2">
                                {canUseItem(item.name, item.category) ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <>
                                    <Coins className="h-4 w-4 text-yellow-500" />
                                    <span className="font-bold">{item.coin_cost}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                            <Button
                              className="w-full"
                              variant={canUseItem(item.name, item.category) ? "default" : "outline"}
                              onClick={() => handleItemSelect(item, 'accessory')}
                              disabled={!canUseItem(item.name, item.category) && balance < item.coin_cost}
                            >
                              {canUseItem(item.name, item.category) ? 'Equip' : 
                               balance >= item.coin_cost ? 'Purchase' : (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Need {item.coin_cost - balance} more coins
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glow-card">
                    <CardHeader>
                      <CardTitle>Shoes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getItemsByCategory('avatar_shoes').map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{item.name}</h4>
                              <div className="flex items-center gap-2">
                                {canUseItem(item.name, item.category) ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <>
                                    <Coins className="h-4 w-4 text-yellow-500" />
                                    <span className="font-bold">{item.coin_cost}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                            <Button
                              className="w-full"
                              variant={canUseItem(item.name, item.category) ? "default" : "outline"}
                              onClick={() => handleItemSelect(item, 'shoes')}
                              disabled={!canUseItem(item.name, item.category) && balance < item.coin_cost}
                            >
                              {canUseItem(item.name, item.category) ? 'Equip' : 
                               balance >= item.coin_cost ? 'Purchase' : (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Need {item.coin_cost - balance} more coins
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Animations & Backgrounds */}
              <TabsContent value="extras">
                <div className="space-y-6">
                  <Card className="glow-card">
                    <CardHeader>
                      <CardTitle>Animations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getItemsByCategory('avatar_animation').map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{item.name}</h4>
                              <div className="flex items-center gap-2">
                                {canUseItem(item.name, item.category) ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <>
                                    <Coins className="h-4 w-4 text-yellow-500" />
                                    <span className="font-bold">{item.coin_cost}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                            <Button
                              className="w-full"
                              variant={canUseItem(item.name, item.category) ? "default" : "outline"}
                              onClick={() => handleItemSelect(item, 'animation')}
                              disabled={!canUseItem(item.name, item.category) && balance < item.coin_cost}
                            >
                              {canUseItem(item.name, item.category) ? 'Equip' : 
                               balance >= item.coin_cost ? 'Purchase' : (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Need {item.coin_cost - balance} more coins
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glow-card">
                    <CardHeader>
                      <CardTitle>Backgrounds</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getItemsByCategory('avatar_background').map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{item.name}</h4>
                              <div className="flex items-center gap-2">
                                {canUseItem(item.name, item.category) ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <>
                                    <Coins className="h-4 w-4 text-yellow-500" />
                                    <span className="font-bold">{item.coin_cost}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                            <Button
                              className="w-full"
                              variant={canUseItem(item.name, item.category) ? "default" : "outline"}
                              onClick={() => handleItemSelect(item, 'background')}
                              disabled={!canUseItem(item.name, item.category) && balance < item.coin_cost}
                            >
                              {canUseItem(item.name, item.category) ? 'Equip' : 
                               balance >= item.coin_cost ? 'Purchase' : (
                                <>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Need {item.coin_cost - balance} more coins
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};