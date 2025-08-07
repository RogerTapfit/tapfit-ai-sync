import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, ArrowRight, Coins, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { InteractiveAvatarPreview } from './InteractiveAvatarPreview';
import { useRobotAvatar, RobotAvatarData } from '@/hooks/useRobotAvatar';
import { useTapCoins } from '@/hooks/useTapCoins';
import { useAvatarPreview } from '@/hooks/useAvatarPreview';
import { CharacterSelector, CHARACTER_OPTIONS } from './CharacterSelector';
import { HueCustomizer } from './HueCustomizer';
import { RobotAvatarDisplay } from './RobotAvatarDisplay';

import { toast } from 'sonner';

interface AvatarBuilderProps {
  onClose: () => void;
  isFirstTime?: boolean;
}

interface BuilderStep {
  id: string;
  title: string;
  description: string;
  category: keyof RobotAvatarData | 'complete';
}

const builderSteps: BuilderStep[] = [
  { id: 'character', title: 'Character', description: 'Choose your robot character', category: 'character_type' },
  { id: 'colors', title: 'Color Scheme', description: 'Customize your character colors', category: 'base_hue' },
  { id: 'tech', title: 'Tech Modules', description: 'Add technology modules', category: 'tech_modules' },
  { id: 'core', title: 'Energy Core', description: 'Choose your power source', category: 'energy_core' },
  { id: 'animation', title: 'Personality', description: 'Choose your robot style', category: 'animation' },
  { id: 'complete', title: 'Complete', description: 'Your robot is ready!', category: 'complete' }
];

export const AvatarBuilder = ({ onClose, isFirstTime = false }: AvatarBuilderProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const { avatarData, loading, updateAvatar, purchaseRobotItem, canUseItem } = useRobotAvatar();
  const { storeItems, balance } = useTapCoins();
  
  // Initialize avatar preview state
  const {
    avatarData: previewData,
    isSaving,
    error,
    hasUnsavedChanges,
    initializeAvatar,
    updatePreview,
    startSave,
    completeSave,
    failSave,
    resetToSaved,
    clearError
  } = useAvatarPreview(avatarData || {
    chassis_type: 'slim_bot',
    color_scheme: { primary: "hsl(0, 84%, 60%)", secondary: "hsl(0, 0%, 15%)", accent: "hsl(0, 100%, 70%)" },
    tech_modules: [],
    energy_core: 'standard',
    animation: 'idle'
  } as RobotAvatarData);

  // Debounced save function
  const debouncedSave = useCallback(async (dataToSave: RobotAvatarData) => {
    startSave();
    try {
      const success = await updateAvatar(dataToSave);
      if (success) {
        completeSave(dataToSave);
      } else {
        failSave('Failed to save avatar changes');
      }
    } catch (error) {
      failSave(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }, [startSave, updateAvatar, completeSave, failSave]);

  const handleNext = useCallback(() => {
    if (currentStep < builderSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  }, [currentStep, onClose]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleItemSelect = useCallback(async (item: any, categoryKey: string) => {
    const itemValue = item.name.toLowerCase().replace(/\s+/g, '_');
    
    if (canUseItem(item.name, item.category)) {
      const updates = { [categoryKey]: itemValue };
      updatePreview(updates as Partial<RobotAvatarData>);
      toast.success(`Applied ${item.name}!`);
    } else {
      if (balance >= item.coin_cost) {
        const success = await purchaseRobotItem(item.id, item.category, itemValue);
        if (success) {
          const updates = { [categoryKey]: itemValue };
          updatePreview(updates as Partial<RobotAvatarData>);
          toast.success(`Purchased and equipped ${item.name}!`);
        }
      } else {
        toast.error(`You need ${item.coin_cost - balance} more Tap Coins!`);
      }
    }
  }, [canUseItem, balance, purchaseRobotItem, updatePreview]);

  const handleBasicOption = useCallback((category: string, value: any) => {
    updatePreview({ [category]: value } as Partial<RobotAvatarData>);
  }, [updatePreview]);

  // Initialize preview when avatar data loads
  useEffect(() => {
    if (avatarData && !previewData.chassis_type) {
      initializeAvatar(avatarData);
    }
  }, [avatarData, previewData.chassis_type, initializeAvatar]);

  // Auto-save changes when preview data changes with debounce
  useEffect(() => {
    if (hasUnsavedChanges && previewData) {
      const timeoutId = setTimeout(() => {
        debouncedSave(previewData);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, previewData, debouncedSave]);

  // Show loading state instead of black screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p>Loading your robot avatar...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if no data after loading
  if (!avatarData || !previewData) {
    console.error('Avatar data missing:', { avatarData, previewData });
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center space-y-4">
            <p className="text-destructive">Failed to load avatar data</p>
            <Button onClick={onClose}>Close Builder</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentStep + 1) / builderSteps.length) * 100;
  const step = builderSteps[currentStep];

  const robotItems = storeItems.filter(item => 
    item.category.startsWith('robot_') || item.category.startsWith('avatar_')
  );

  const getItemsByCategory = (category: string) => {
    return robotItems.filter(item => item.category === category);
  };


  const renderStepContent = () => {
    switch (step.id) {
      case 'character':
        const ownedCharacters = CHARACTER_OPTIONS
          .filter(char => char.unlockCost === 0 || canUseItem(char.name, 'character'))
          .map(char => char.id);

        return (
          <div className="space-y-6">
            <CharacterSelector
              selectedCharacter={previewData?.character_type}
              onCharacterSelect={(characterId) => handleBasicOption('character_type', characterId)}
              ownedCharacters={ownedCharacters}
              canAfford={(cost) => balance >= cost}
              onPurchase={async (characterId, cost) => {
                const success = await purchaseRobotItem(characterId, 'character_type', characterId);
                if (success) {
                  handleBasicOption('character_type', characterId);
                  toast.success(`Unlocked ${CHARACTER_OPTIONS.find(c => c.id === characterId)?.name}!`);
                } else {
                  toast.error('Purchase failed. Please try again.');
                }
              }}
            />
          </div>
        );

      case 'colors':
        return (
          <div className="space-y-6">
            <HueCustomizer
              currentHue={previewData?.base_hue || 0}
              onHueChange={(hue) => handleBasicOption('base_hue', hue)}
              characterType={previewData?.character_type || 'steel_warrior'}
              previewComponent={
                <RobotAvatarDisplay
                  avatarData={previewData!}
                  size="small"
                  showAnimation={true}
                  emotion="happy"
                />
              }
            />
          </div>
        );

      case 'tech':
        return (
          <TooltipProvider>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Available Tech Modules</h4>
                
                {/* Mobile: Horizontal scroll */}
                <div className="block sm:hidden">
                  <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                    <div className="flex w-max space-x-4 p-4">
                      {[
                        { name: 'Basic Scanner', value: 'basic_scanner', description: '📡 Basic sensor array' },
                        { name: 'Heart Monitor', value: 'heart_monitor', description: '💓 Advanced biometrics' },
                        { name: 'Power Boost', value: 'power_boost', description: '⚡ Enhanced performance' },
                        { name: 'Data Logger', value: 'data_logger', description: '📊 Workout analytics' },
                        { name: 'AI Assistant', value: 'ai_assistant', description: '🤖 Smart coaching' },
                        { name: 'Stealth Mode', value: 'stealth_mode', description: '👻 Ninja protocols' }
                      ].map((module) => {
                        const isEquipped = previewData?.tech_modules?.includes(module.value) || false;
                        return (
                          <Tooltip key={module.value}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={isEquipped ? "default" : "outline"}
                                className="min-w-[120px] min-h-20 flex-col gap-2 p-4"
                                onClick={() => {
                                  const currentModules = previewData?.tech_modules || [];
                                  const newModules = isEquipped 
                                    ? currentModules.filter(m => m !== module.value)
                                    : [...currentModules, module.value];
                                  handleBasicOption('tech_modules', newModules);
                                }}
                              >
                                <span className="font-semibold text-sm">{module.name}</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{module.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>

                {/* Desktop: Responsive grid */}
                <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'Basic Scanner', value: 'basic_scanner', description: '📡 Basic sensor array' },
                    { name: 'Heart Monitor', value: 'heart_monitor', description: '💓 Advanced biometrics' },
                    { name: 'Power Boost', value: 'power_boost', description: '⚡ Enhanced performance' },
                    { name: 'Data Logger', value: 'data_logger', description: '📊 Workout analytics' },
                    { name: 'AI Assistant', value: 'ai_assistant', description: '🤖 Smart coaching' },
                    { name: 'Stealth Mode', value: 'stealth_mode', description: '👻 Ninja protocols' }
                  ].map((module) => {
                    const isEquipped = previewData?.tech_modules?.includes(module.value) || false;
                    return (
                      <Button
                        key={module.value}
                        variant={isEquipped ? "default" : "outline"}
                        className="min-h-20 flex-col gap-2 p-4"
                        onClick={() => {
                          const currentModules = previewData?.tech_modules || [];
                          const newModules = isEquipped 
                            ? currentModules.filter(m => m !== module.value)
                            : [...currentModules, module.value];
                          handleBasicOption('tech_modules', newModules);
                        }}
                      >
                        <span className="font-semibold text-sm">{module.name}</span>
                        <span className="text-xs text-muted-foreground text-center leading-tight">{module.description}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          </TooltipProvider>
        );

      case 'core':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Energy Core Type</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Standard Core', value: 'standard', description: '🔋 Reliable power', free: true },
                  { name: 'Fusion Core', value: 'fusion', description: '⚛️ High-energy output' },
                  { name: 'Quantum Core', value: 'quantum', description: '🌌 Unlimited potential' },
                  { name: 'Solar Core', value: 'solar', description: '☀️ Eco-friendly power' },
                  { name: 'Arc Reactor', value: 'arc_reactor', description: '💎 Premium technology' }
                ].map((core) => (
                  <Button
                    key={core.value}
                    variant={previewData?.energy_core === core.value ? "default" : "outline"}
                    className="min-h-20 flex-col gap-2 p-4"
                    onClick={() => handleBasicOption('energy_core', core.value)}
                  >
                    <span className="font-semibold text-sm">{core.name}</span>
                    <span className="text-xs text-muted-foreground text-center leading-tight">{core.description}</span>
                    {core.free && <span className="text-xs text-green-500">Free</span>}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Power Level: {previewData?.power_level || 25}%</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newLevel = Math.max(0, (previewData?.power_level || 25) - 10);
                    handleBasicOption('power_level', newLevel);
                  }}
                  disabled={(previewData?.power_level || 25) <= 0}
                >
                  -10%
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newLevel = Math.min(100, (previewData?.power_level || 25) + 10);
                    handleBasicOption('power_level', newLevel);
                  }}
                  disabled={(previewData?.power_level || 25) >= 100}
                >
                  +10%
                </Button>
              </div>
            </div>
          </div>
        );

      case 'animation':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Robot Animations</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Power Up', value: 'power_up', description: '⚡ Boot sequence' },
                  { name: 'Idle', value: 'idle', description: '🤖 Standby mode' },
                  { name: 'Victory', value: 'victory', description: '🏆 Celebration' },
                  { name: 'Training', value: 'training', description: '💪 Workout mode' },
                  { name: 'Scan Mode', value: 'scan', description: '👁️ Analysis mode' },
                  { name: 'Sleep Mode', value: 'sleep', description: '😴 Power saving' }
                ].map((animation) => (
                  <Button
                    key={animation.value}
                    variant={previewData?.animation === animation.value ? "default" : "outline"}
                    className="min-h-20 flex-col gap-2 p-4"
                    onClick={() => handleBasicOption('animation', animation.value)}
                  >
                    <span className="font-semibold text-sm">{animation.name}</span>
                    <span className="text-xs text-muted-foreground text-center leading-tight">{animation.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Background</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'Tech Lab', value: 'tech_lab', description: '🔬 Research facility' },
                  { name: 'Gym Floor', value: 'gym', description: '🏋️ Training ground' },
                  { name: 'Cyber Space', value: 'cyber_space', description: '🌐 Digital realm' },
                  { name: 'Factory', value: 'factory', description: '🏭 Manufacturing' }
                ].map((bg) => (
                  <Button
                    key={bg.value}
                    variant={previewData?.background === bg.value ? "default" : "outline"}
                    className="min-h-16 flex-col gap-1 p-3"
                    onClick={() => handleBasicOption('background', bg.value)}
                  >
                    <span className="font-semibold text-sm">{bg.name}</span>
                    <span className="text-xs text-muted-foreground text-center leading-tight">{bg.description}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Sparkles className="h-16 w-16 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Your Robot is Ready!</h3>
              <p className="text-muted-foreground">
                {isFirstTime 
                  ? "Welcome to TapFit! Your robot avatar will be your companion throughout your fitness journey."
                  : "Your robot avatar has been updated successfully!"
                }
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">
                🤖 Your robot will appear on leaderboards<br/>
                🏆 Show off in challenges and rewards<br/>
                👥 Be seen by friends and fellow athletes<br/>
                🎮 Unlock new upgrades with Tap Coins<br/>
                ⚡ Power level: {previewData?.power_level || 25}%<br/>
                🔧 Tech modules: {previewData?.tech_modules?.length || 1}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {isFirstTime ? 'Build Your Robot' : 'Robot Builder'}
              </h1>
              <p className="text-muted-foreground">Step {currentStep + 1} of {builderSteps.length}</p>
            </div>
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                {error}
                <Button variant="ghost" size="sm" onClick={clearError}>
                  ×
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 h-5 text-yellow-500" />
              <span className="font-bold text-lg">{balance.toLocaleString()}</span>
            </div>
            {hasUnsavedChanges && (
              <Button variant="ghost" size="sm" onClick={resetToSaved}>
                Reset Changes
              </Button>
            )}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Avatar Preview */}
          <Card className="lg:sticky lg:top-4 lg:h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-center gap-2">
                Live Preview 
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative w-full min-h-[280px] max-h-[400px] aspect-square mx-auto bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary/20 flex items-center justify-center p-6 overflow-hidden">
                <InteractiveAvatarPreview
                  avatarData={previewData!}
                  size="lg"
                  showControls
                  showStatusIndicators
                  className="w-full h-full"
                />
              </div>
              <div className="text-sm text-muted-foreground text-center mt-2">
                <div className="font-semibold">
                  {previewData?.chassis_type?.replace(/_/g, ' ').toUpperCase() || 'ROBOT'}
                </div>
                <div className="text-xs">
                  Power: {previewData?.power_level || 25}% | Modules: {previewData?.tech_modules?.length || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customization Panel */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>

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
  );
};