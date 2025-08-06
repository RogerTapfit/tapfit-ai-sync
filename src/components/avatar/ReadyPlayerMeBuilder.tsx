import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Coins, Sparkles, User, Palette, Shirt, Smile } from 'lucide-react';
import { useReadyPlayerMe } from '@/hooks/useReadyPlayerMe';
import { FITNESS_CUSTOMIZATIONS } from '@/services/readyPlayerMeService';
import { motion } from 'framer-motion';

interface ReadyPlayerMeBuilderProps {
  onClose: () => void;
  isFirstTime?: boolean;
}

export const ReadyPlayerMeBuilder = ({ onClose, isFirstTime = false }: ReadyPlayerMeBuilderProps) => {
  const { 
    avatar, 
    loading, 
    updateCustomization, 
    purchaseCustomization, 
    canUseCustomization,
    getCustomizationCost 
  } = useReadyPlayerMe();
  
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 'body', title: 'Body Type', icon: User, description: 'Choose your fitness build' },
    { id: 'colors', title: 'Colors', icon: Palette, description: 'Pick your theme' },
    { id: 'accessories', title: 'Gear', icon: Shirt, description: 'Add fitness accessories' },
    { id: 'expressions', title: 'Style', icon: Smile, description: 'Set your personality' }
  ];

  const handleCustomizationSelect = async (type: string, value: string) => {
    if (canUseCustomization(value)) {
      await updateCustomization({ [type]: value });
    } else {
      const result = await purchaseCustomization(value);
      if (result.success) {
        await updateCustomization({ [type]: value });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p>Creating your fitness avatar...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  TapFit Avatar Builder
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Create your personalized fitness companion
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                <span className="font-mono">Balance Available</span>
              </div>
            </div>
            <Progress value={progress} className="w-full" />
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avatar Preview */}
          <Card className="lg:sticky lg:top-4">
            <CardHeader>
              <CardTitle>Your Avatar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary/20 flex items-center justify-center">
                {avatar ? (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="text-6xl mb-4">🤖</div>
                    <div className="space-y-1">
                      <Badge variant="outline">{avatar.customizations.bodyType}</Badge>
                      <Badge variant="outline">{avatar.customizations.colorScheme}</Badge>
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-muted-foreground">Loading avatar...</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customization Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <step.icon className="h-6 w-6" />
                <div>
                  <CardTitle>{step.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {step.id === 'body' && (
                <div className="grid grid-cols-2 gap-3">
                  {FITNESS_CUSTOMIZATIONS.bodyTypes.map((bodyType) => (
                    <Button
                      key={bodyType.id}
                      variant={avatar?.customizations.bodyType === bodyType.id ? "default" : "outline"}
                      className="h-auto p-4 flex-col gap-2"
                      onClick={() => handleCustomizationSelect('bodyType', bodyType.id)}
                    >
                      <span className="font-semibold">{bodyType.name}</span>
                      <span className="text-xs text-muted-foreground text-center">
                        {bodyType.description}
                      </span>
                    </Button>
                  ))}
                </div>
              )}

              {step.id === 'colors' && (
                <div className="grid grid-cols-2 gap-3">
                  {FITNESS_CUSTOMIZATIONS.colorSchemes.map((scheme) => (
                    <Button
                      key={scheme.id}
                      variant={avatar?.customizations.colorScheme === scheme.id ? "default" : "outline"}
                      className="h-auto p-4 flex-col gap-2"
                      onClick={() => handleCustomizationSelect('colorScheme', scheme.id)}
                    >
                      <span className="font-semibold">{scheme.name}</span>
                      <div className="flex gap-1">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: scheme.primary }} />
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: scheme.secondary }} />
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: scheme.accent }} />
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button 
            onClick={() => {
              if (currentStep === steps.length - 1) {
                onClose();
              } else {
                setCurrentStep(currentStep + 1);
              }
            }}
          >
            {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};