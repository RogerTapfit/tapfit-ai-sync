import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Target, Dumbbell, Calendar, Heart } from 'lucide-react';

interface EnhancedProfile {
  age: number;
  weight_kg: number;
  height_cm: number;
  weight_lbs: number;
  height_feet: number;
  height_inches: number;
  gender: 'male' | 'female' | 'other';
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  primary_goal: 'fat_loss' | 'muscle_building' | 'general_fitness' | 'strength_training';
  preferred_equipment_type: 'machines' | 'free_weights' | 'bodyweight' | 'mixed';
  diet_type: 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'high_protein';
  health_conditions?: string;
  previous_injuries?: string;
}

interface EnhancedOnboardingProps {
  onComplete: () => void;
}

const EnhancedOnboarding: React.FC<EnhancedOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<EnhancedProfile>({
    age: 25,
    weight_kg: 70,
    height_cm: 170,
    weight_lbs: 154,
    height_feet: 5,
    height_inches: 7,
    gender: 'other',
    experience_level: 'beginner',
    primary_goal: 'general_fitness',
    preferred_equipment_type: 'mixed',
    diet_type: 'omnivore'
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  // Conversion utilities
  const lbsToKg = (lbs: number) => lbs * 0.453592;
  const kgToLbs = (kg: number) => kg / 0.453592;
  const feetInchesToCm = (feet: number, inches: number) => (feet * 12 + inches) * 2.54;
  const cmToFeetInches = (cm: number) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  const handleInputChange = (field: keyof EnhancedProfile, value: any) => {
    setProfile(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-convert when weight or height changes
      if (field === 'weight_lbs') {
        updated.weight_kg = lbsToKg(value);
      } else if (field === 'weight_kg') {
        updated.weight_lbs = kgToLbs(value);
      } else if (field === 'height_feet' || field === 'height_inches') {
        const feet = field === 'height_feet' ? value : prev.height_feet;
        const inches = field === 'height_inches' ? value : prev.height_inches;
        updated.height_cm = feetInchesToCm(feet, inches);
      } else if (field === 'height_cm') {
        const { feet, inches } = cmToFeetInches(value);
        updated.height_feet = feet;
        updated.height_inches = inches;
      }
      
      return updated;
    });
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in to continue");
        setLoading(false);
        return;
      }

      console.log('💾 Saving enhanced profile data:', profile);

      // Update profile with enhanced data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          age: profile.age,
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm,
          gender: profile.gender,
          experience_level: profile.experience_level,
          primary_goal: profile.primary_goal,
          preferred_equipment_type: profile.preferred_equipment_type,
          diet_type: profile.diet_type,
          onboarding_completed: true
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('❌ Error updating profile:', profileError);
        toast.error(`Failed to save profile: ${profileError.message}`);
        setLoading(false);
        return;
      }

      console.log('✅ Profile saved successfully, starting calibration...');

      // Complete calibration process
      const { data: calibrationResult, error: calibrationError } = await supabase
        .rpc('complete_user_calibration', { _user_id: user.id });

      if (calibrationError) {
        console.error('❌ Calibration error:', calibrationError);
        toast.error(`Calibration failed: ${calibrationError.message}`);
        setLoading(false);
        return;
      }

      if (!calibrationResult) {
        console.error('❌ Calibration returned false');
        toast.error("Calibration failed. Please check your profile data.");
        setLoading(false);
        return;
      }

      console.log('✅ Calibration completed successfully');
      toast.success('Profile setup complete! Your personalized workout plans are ready.');
      onComplete();
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <User className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Basic Information</h2>
              <p className="text-muted-foreground">Help us personalize your experience</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 25)}
                  min="13"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={profile.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={profile.weight_lbs}
                  onChange={(e) => handleInputChange('weight_lbs', parseFloat(e.target.value) || 154)}
                  min="88"
                  max="440"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height-feet">Height (feet)</Label>
                <Input
                  id="height-feet"
                  type="number"
                  value={profile.height_feet}
                  onChange={(e) => handleInputChange('height_feet', parseInt(e.target.value) || 5)}
                  min="3"
                  max="9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height-inches">Height (inches)</Label>
                <Input
                  id="height-inches"
                  type="number"
                  value={profile.height_inches}
                  onChange={(e) => handleInputChange('height_inches', e.target.value === '' ? 7 : parseInt(e.target.value) || 0)}
                  min="0"
                  max="11"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Target className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Fitness Goals</h2>
              <p className="text-muted-foreground">What do you want to achieve?</p>
            </div>

            <div className="space-y-4">
              <Label>Primary Goal</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'fat_loss', label: 'Fat Loss', desc: 'Lose weight and improve definition' },
                  { value: 'muscle_building', label: 'Muscle Building', desc: 'Gain muscle mass and size' },
                  { value: 'general_fitness', label: 'General Fitness', desc: 'Stay healthy and active' },
                  { value: 'strength_training', label: 'Strength Training', desc: 'Increase power and strength' }
                ].map((goal) => (
                  <Card 
                    key={goal.value}
                    className={`cursor-pointer transition-all ${profile.primary_goal === goal.value ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleInputChange('primary_goal', goal.value)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{goal.label}</h3>
                      <p className="text-sm text-muted-foreground">{goal.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Dumbbell className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Experience Level</h2>
              <p className="text-muted-foreground">Help us set the right intensity</p>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3">
                {[
                  { 
                    value: 'beginner', 
                    label: 'Beginner', 
                    desc: 'New to working out or returning after a break',
                    badges: ['0-6 months', 'Basic movements', 'Guided workouts']
                  },
                  { 
                    value: 'intermediate', 
                    label: 'Intermediate', 
                    desc: 'Consistent training for 6+ months',
                    badges: ['6+ months', 'Good form', 'Progressive overload']
                  },
                  { 
                    value: 'advanced', 
                    label: 'Advanced', 
                    desc: 'Training for years with excellent form',
                    badges: ['2+ years', 'Advanced techniques', 'Competition level']
                  }
                ].map((level) => (
                  <Card 
                    key={level.value}
                    className={`cursor-pointer transition-all ${profile.experience_level === level.value ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleInputChange('experience_level', level.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{level.label}</h3>
                          <p className="text-sm text-muted-foreground">{level.desc}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {level.badges.map((badge) => (
                            <Badge key={badge} variant="secondary" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Calendar className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Equipment Preferences</h2>
              <p className="text-muted-foreground">What type of equipment do you prefer?</p>
            </div>

            <div className="space-y-4">
              <Label>Preferred Equipment Type</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'machines', label: 'Machines', desc: 'Guided movements, safer for beginners' },
                  { value: 'free_weights', label: 'Free Weights', desc: 'Barbells, dumbbells, functional training' },
                  { value: 'bodyweight', label: 'Bodyweight', desc: 'No equipment needed, anywhere training' },
                  { value: 'mixed', label: 'Mixed', desc: 'Combination of all equipment types' }
                ].map((type) => (
                  <Card 
                    key={type.value}
                    className={`cursor-pointer transition-all ${profile.preferred_equipment_type === type.value ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleInputChange('preferred_equipment_type', type.value)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{type.label}</h3>
                      <p className="text-sm text-muted-foreground">{type.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Diet Type</Label>
              <Select value={profile.diet_type} onValueChange={(value) => handleInputChange('diet_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="omnivore">Omnivore</SelectItem>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="keto">Keto</SelectItem>
                  <SelectItem value="high_protein">High Protein</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Health & Safety</h2>
              <p className="text-muted-foreground">Help us keep you safe during workouts</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="health-conditions">Health Conditions (Optional)</Label>
                <Textarea
                  id="health-conditions"
                  placeholder="Any chronic conditions, medications, or health concerns we should know about..."
                  value={profile.health_conditions || ''}
                  onChange={(e) => handleInputChange('health_conditions', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="injuries">Previous Injuries (Optional)</Label>
                <Textarea
                  id="injuries"
                  placeholder="Any past injuries, surgeries, or areas that need special attention..."
                  value={profile.previous_injuries || ''}
                  onChange={(e) => handleInputChange('previous_injuries', e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Profile Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Age: {profile.age} years</div>
                <div>Weight: {Math.round(profile.weight_lbs)} lbs</div>
                <div>Height: {profile.height_feet}'{profile.height_inches}"</div>
                <div>Goal: {profile.primary_goal.replace('_', ' ')}</div>
                <div>Experience: {profile.experience_level}</div>
                <div>Equipment: {profile.preferred_equipment_type.replace('_', ' ')}</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Progress value={progress} className="mb-2" />
        <p className="text-sm text-muted-foreground text-center">
          Step {currentStep} of {totalSteps}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Complete Your Fitness Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep()}
          
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>
            <Button 
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? 'Saving...' : currentStep === totalSteps ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedOnboarding;