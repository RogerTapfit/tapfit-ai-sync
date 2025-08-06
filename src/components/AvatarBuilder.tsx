import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Coins, Sparkles } from 'lucide-react';
import { RobotAvatarDisplay } from './RobotAvatarDisplay';
import { useRobotAvatar, RobotAvatarData } from '@/hooks/useRobotAvatar';
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
  category: keyof RobotAvatarData | 'complete';
}

const builderSteps: BuilderStep[] = [
  { id: 'chassis', title: 'Chassis', description: 'Select your robot frame', category: 'chassis_type' },
  { id: 'colors', title: 'Color Scheme', description: 'Pick your robot colors', category: 'color_scheme' },
  { id: 'tech', title: 'Tech Modules', description: 'Add technology modules', category: 'tech_modules' },
  { id: 'core', title: 'Energy Core', description: 'Choose your power source', category: 'energy_core' },
  { id: 'animation', title: 'Personality', description: 'Choose your robot style', category: 'animation' },
  { id: 'complete', title: 'Complete', description: 'Your robot is ready!', category: 'complete' }
];

export const AvatarBuilder = ({ onClose, isFirstTime = false }: AvatarBuilderProps) => {
  const { avatarData, updateAvatar, purchaseRobotItem, canUseItem } = useRobotAvatar();
  const { storeItems, balance } = useTapCoins();
  const [currentStep, setCurrentStep] = useState(0);
  const [previewData, setPreviewData] = useState<RobotAvatarData | null>(avatarData);

  if (!avatarData || !previewData) return null;

  const progress = ((currentStep + 1) / builderSteps.length) * 100;
  const step = builderSteps[currentStep];

  const robotItems = storeItems.filter(item => 
    item.category.startsWith('robot_') || item.category.startsWith('avatar_')
  );

  const getItemsByCategory = (category: string) => {
    return robotItems.filter(item => item.category === category);
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
      const updateData = { [categoryKey]: itemValue };
      setPreviewData({ ...previewData!, ...updateData });
      await updateAvatar(updateData as Partial<RobotAvatarData>);
      toast.success(`Applied ${item.name}!`);
    } else {
      if (balance >= item.coin_cost) {
        const success = await purchaseRobotItem(item.id, item.category, itemValue);
        if (success) {
          const updateData = { [categoryKey]: itemValue };
          setPreviewData({ ...previewData!, ...updateData });
          toast.success(`Purchased and equipped ${item.name}!`);
        }
      } else {
        toast.error(`You need ${item.coin_cost - balance} more Tap Coins!`);
      }
    }
  };

  const handleBasicOption = async (category: string, value: any) => {
    const updateData = { [category]: value };
    setPreviewData({ ...previewData!, ...updateData });
    await updateAvatar(updateData as Partial<RobotAvatarData>);
  };

  const renderStepContent = () => {
    switch (step.id) {
      case 'chassis':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Robot Chassis Type</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Slim Bot', value: 'slim_bot', description: 'Agile and lightweight' },
                  { name: 'Bulky Bot', value: 'bulky_bot', description: 'Heavy-duty and strong' },
                  { name: 'Agile Bot', value: 'agile_bot', description: 'Fast and flexible' },
                  { name: 'Tall Bot', value: 'tall_bot', description: 'Imposing and tall' },
                  { name: 'Compact Bot', value: 'compact_bot', description: 'Small but powerful' }
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={previewData?.chassis_type === option.value ? "default" : "outline"}
                    className="h-20 flex-col gap-2 p-4"
                    onClick={() => handleBasicOption('chassis_type', option.value)}
                  >
                    <span className="font-semibold">{option.name}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'colors':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Color Schemes</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { 
                    name: 'TapFit Red', 
                    value: { primary: "hsl(0, 84%, 60%)", secondary: "hsl(0, 0%, 15%)", accent: "hsl(0, 100%, 70%)" },
                    colors: ["bg-red-500", "bg-gray-800", "bg-red-400"]
                  },
                  { 
                    name: 'Electric Blue', 
                    value: { primary: "hsl(220, 84%, 60%)", secondary: "hsl(220, 20%, 20%)", accent: "hsl(220, 100%, 80%)" },
                    colors: ["bg-blue-500", "bg-blue-900", "bg-blue-300"]
                  },
                  { 
                    name: 'Cyber Green', 
                    value: { primary: "hsl(120, 84%, 50%)", secondary: "hsl(120, 20%, 15%)", accent: "hsl(120, 100%, 70%)" },
                    colors: ["bg-green-500", "bg-green-900", "bg-green-300"]
                  },
                  { 
                    name: 'Neon Purple', 
                    value: { primary: "hsl(280, 84%, 60%)", secondary: "hsl(280, 20%, 20%)", accent: "hsl(280, 100%, 80%)" },
                    colors: ["bg-purple-500", "bg-purple-900", "bg-purple-300"]
                  }
                ].map((option) => (
                  <Button
                    key={option.name}
                    variant={JSON.stringify(previewData?.color_scheme) === JSON.stringify(option.value) ? "default" : "outline"}
                    className="h-20 flex-col gap-2 p-4"
                    onClick={() => handleBasicOption('color_scheme', option.value)}
                  >
                    <span className="font-semibold">{option.name}</span>
                    <div className="flex gap-1">
                      {option.colors.map((color, i) => (
                        <div key={i} className={`w-4 h-4 rounded ${color}`} />
                      ))}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'tech':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Available Tech Modules</h4>
              <div className="grid grid-cols-2 gap-3">
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
                      className="h-20 flex-col gap-2 p-4"
                      onClick={() => {
                        const currentModules = previewData?.tech_modules || [];
                        const newModules = isEquipped 
                          ? currentModules.filter(m => m !== module.value)
                          : [...currentModules, module.value];
                        handleBasicOption('tech_modules', newModules);
                      }}
                    >
                      <span className="font-semibold">{module.name}</span>
                      <span className="text-xs text-muted-foreground text-center">{module.description}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'core':
        return (
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Energy Core Type</h4>
              <div className="grid grid-cols-2 gap-3">
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
                    className="h-20 flex-col gap-2 p-4"
                    onClick={() => handleBasicOption('energy_core', core.value)}
                  >
                    <span className="font-semibold">{core.name}</span>
                    <span className="text-xs text-muted-foreground text-center">{core.description}</span>
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
              <div className="grid grid-cols-2 gap-3">
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
                    className="h-20 flex-col gap-2 p-4"
                    onClick={() => handleBasicOption('animation', animation.value)}
                  >
                    <span className="font-semibold">{animation.name}</span>
                    <span className="text-xs text-muted-foreground text-center">{animation.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Background</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Tech Lab', value: 'tech_lab', description: '🔬 Research facility' },
                  { name: 'Gym Floor', value: 'gym', description: '🏋️ Training ground' },
                  { name: 'Cyber Space', value: 'cyber_space', description: '🌐 Digital realm' },
                  { name: 'Factory', value: 'factory', description: '🏭 Manufacturing' }
                ].map((bg) => (
                  <Button
                    key={bg.value}
                    variant={previewData?.background === bg.value ? "default" : "outline"}
                    className="h-16 flex-col gap-1 p-3"
                    onClick={() => handleBasicOption('background', bg.value)}
                  >
                    <span className="font-semibold text-sm">{bg.name}</span>
                    <span className="text-xs text-muted-foreground text-center">{bg.description}</span>
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
                {isFirstTime ? 'Build Your Robot' : 'Robot Builder'}
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
                <RobotAvatarDisplay 
                  avatarData={previewData!} 
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