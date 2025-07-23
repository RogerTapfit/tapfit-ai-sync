import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Coins, Sparkles } from 'lucide-react';
import { AvatarDisplay } from './AvatarDisplay';
import { useAvatar, AvatarData } from '@/hooks/useAvatar';
import { useTapCoins } from '@/hooks/useTapCoins';
import { toast } from 'sonner';

interface AvatarBuilderProps {
  onClose: () => void;
  isFirstTime?: boolean;
}

interface BuilderStep {
  id: string;
  title: string;
  description: string;
  category: keyof AvatarData | 'complete';
}

const builderSteps: BuilderStep[] = [
  { id: 'appearance', title: 'Appearance', description: 'Choose your skin tone', category: 'skin_tone' },
  { id: 'hair', title: 'Hair Style', description: 'Pick your hairstyle and color', category: 'hair_style' },
  { id: 'outfit', title: 'Outfit', description: 'Select your outfit', category: 'outfit' },
  { id: 'accessories', title: 'Accessories', description: 'Add some style', category: 'accessory' },
  { id: 'animation', title: 'Personality', description: 'Choose your vibe', category: 'animation' },
  { id: 'complete', title: 'Complete', description: 'Your avatar is ready!', category: 'complete' }
];

export const AvatarBuilder = ({ onClose, isFirstTime = false }: AvatarBuilderProps) => {
  const { avatarData, updateAvatar, purchaseAvatarItem, canUseItem } = useAvatar();
  const { storeItems, balance } = useTapCoins();
  const [currentStep, setCurrentStep] = useState(0);
  const [previewData, setPreviewData] = useState<AvatarData | null>(avatarData);

  if (!avatarData || !previewData) return null;

  const progress = ((currentStep + 1) / builderSteps.length) * 100;
  const step = builderSteps[currentStep];

  const avatarItems = storeItems.filter(item => 
    item.category.startsWith('avatar_')
  );

  const getItemsByCategory = (category: string) => {
    return avatarItems.filter(item => item.category === category);
  };

  const handleNext = () => {
    if (currentStep < builderSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleItemSelect = async (item: any, categoryKey: string) => {
    const itemValue = item.name.toLowerCase().replace(/\s+/g, '_');
    
    if (canUseItem(item.name, item.category)) {
      const newData = { ...previewData, [categoryKey]: itemValue };
      setPreviewData(newData);
      await updateAvatar({ [categoryKey]: itemValue });
      toast.success(`Applied ${item.name}!`);
    } else {
      if (balance >= item.coin_cost) {
        const success = await purchaseAvatarItem(item.id, item.category, itemValue);
        if (success) {
          const newData = { ...previewData, [categoryKey]: itemValue };
          setPreviewData(newData);
          toast.success(`Purchased and equipped ${item.name}!`);
        }
      } else {
        toast.error(`You need ${item.coin_cost - balance} more Tap Coins!`);
      }
    }
  };

  const handleBasicOption = async (category: string, value: string) => {
    const newData = { ...previewData, [category]: value };
    setPreviewData(newData);
    await updateAvatar({ [category]: value });
  };

  const renderStepContent = () => {
    switch (step.id) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Skin Tone</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Light', value: 'light', color: '#fdbcb4' },
                  { name: 'Medium', value: 'medium', color: '#e1906b' },
                  { name: 'Tan', value: 'tan', color: '#deb887' },
                  { name: 'Dark', value: 'dark', color: '#8d5524' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={previewData.skin_tone === option.value ? "default" : "outline"}
                    className="h-16 flex-col gap-2"
                    onClick={() => handleBasicOption('skin_tone', option.value)}
                  >
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white"
                      style={{ backgroundColor: option.color }}
                    />
                    {option.name}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Eye Color</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Brown', value: 'brown' },
                  { name: 'Blue', value: 'blue' },
                  { name: 'Green', value: 'green' },
                  { name: 'Hazel', value: 'hazel' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={previewData.eye_color === option.value ? "default" : "outline"}
                    onClick={() => handleBasicOption('eye_color', option.value)}
                  >
                    {option.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'hair':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Hair Color</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Brown', value: 'brown' },
                  { name: 'Black', value: 'black' },
                  { name: 'Blonde', value: 'blonde' },
                  { name: 'Red', value: 'red' },
                  { name: 'Gray', value: 'gray' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={previewData.hair_color === option.value ? "default" : "outline"}
                    onClick={() => handleBasicOption('hair_color', option.value)}
                  >
                    {option.name}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Hair Style</h4>
              <div className="space-y-3">
                {getItemsByCategory('avatar_hair').map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium">{item.name}</h5>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!canUseItem(item.name, item.category) && (
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-yellow-500" />
                          <span className="font-bold text-sm">{item.coin_cost}</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        variant={canUseItem(item.name, item.category) ? "default" : "outline"}
                        onClick={() => handleItemSelect(item, 'hair_style')}
                        disabled={!canUseItem(item.name, item.category) && balance < item.coin_cost}
                      >
                        {canUseItem(item.name, item.category) ? 'Select' : 'Buy'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'outfit':
        return (
          <div className="space-y-3">
            {getItemsByCategory('avatar_outfit').map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div>
                  <h5 className="font-medium">{item.name}</h5>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!canUseItem(item.name, item.category) && item.coin_cost > 0 && (
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-sm">{item.coin_cost}</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={canUseItem(item.name, item.category) ? "default" : "outline"}
                    onClick={() => handleItemSelect(item, 'outfit')}
                    disabled={!canUseItem(item.name, item.category) && balance < item.coin_cost}
                  >
                    {canUseItem(item.name, item.category) ? 'Select' : item.coin_cost > 0 ? 'Buy' : 'Free'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'accessories':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h5 className="font-medium">No Accessory</h5>
                <p className="text-sm text-muted-foreground">Keep it simple</p>
              </div>
              <Button
                size="sm"
                variant={!previewData.accessory ? "default" : "outline"}
                onClick={() => handleBasicOption('accessory', '')}
              >
                Select
              </Button>
            </div>
            {getItemsByCategory('avatar_accessory').map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h5 className="font-medium">{item.name}</h5>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!canUseItem(item.name, item.category) && (
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-sm">{item.coin_cost}</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={canUseItem(item.name, item.category) ? "default" : "outline"}
                    onClick={() => handleItemSelect(item, 'accessory')}
                    disabled={!canUseItem(item.name, item.category) && balance < item.coin_cost}
                  >
                    {canUseItem(item.name, item.category) ? 'Select' : 'Buy'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'animation':
        return (
          <div className="space-y-3">
            {getItemsByCategory('avatar_animation').map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                <div>
                  <h5 className="font-medium">{item.name}</h5>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!canUseItem(item.name, item.category) && item.coin_cost > 0 && (
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-sm">{item.coin_cost}</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant={canUseItem(item.name, item.category) ? "default" : "outline"}
                    onClick={() => handleItemSelect(item, 'animation')}
                    disabled={!canUseItem(item.name, item.category) && balance < item.coin_cost}
                  >
                    {canUseItem(item.name, item.category) ? 'Select' : item.coin_cost > 0 ? 'Buy' : 'Free'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Sparkles className="h-16 w-16 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Your Avatar is Ready!</h3>
              <p className="text-muted-foreground">
                {isFirstTime 
                  ? "Welcome to TapFit! Your avatar will represent you throughout your fitness journey."
                  : "Your avatar has been updated successfully!"
                }
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">
                💪 Your avatar will appear on leaderboards<br/>
                🏆 Show off in challenges and rewards<br/>
                👥 Be seen by friends and fellow athletes<br/>
                🎮 Unlock new items with Tap Coins
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isFirstTime ? 'Create Your Avatar' : 'Avatar Builder'}
              </h1>
              <p className="text-muted-foreground">Step {currentStep + 1} of {builderSteps.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span className="font-bold text-lg">{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{step.title}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar Preview */}
          <div className="lg:col-span-1">
            <Card className="glow-card p-6 sticky top-4">
              <CardHeader>
                <CardTitle className="text-center">Live Preview</CardTitle>
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

          {/* Step Content */}
          <div className="lg:col-span-2">
            <Card className="glow-card">
              <CardHeader>
                <CardTitle>{step.title}</CardTitle>
                <p className="text-muted-foreground">{step.description}</p>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleNext}>
                {currentStep === builderSteps.length - 1 ? 'Finish' : 'Next'}
                {currentStep !== builderSteps.length - 1 && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};