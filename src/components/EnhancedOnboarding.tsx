import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Target, Dumbbell, Calendar, Heart, Ruler, AtSign, Check, X, Loader2, Globe } from 'lucide-react';
import { SmartWeightRecommendation } from './SmartWeightRecommendation';
import { UserWeightProfile } from '@/services/weightCalculationService';
import { lbsToKg, kgToLbs, feetInchesToCm, cmToFeetInches } from '@/lib/unitConversions';
import type { UnitSystem } from '@/lib/unitConversions';
import { useSocialProfile } from '@/hooks/useSocialProfile';
import { useLanguage, supportedLanguages, SupportedLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSmartRecommendation, setShowSmartRecommendation] = useState(false);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(language);
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

  // New: raw string inputs for mobile-friendly numeric entry
  const [ageInput, setAgeInput] = useState<string>(String(25));
  const [weightLbsInput, setWeightLbsInput] = useState<string>(String(154));
  const [heightFeetInput, setHeightFeetInput] = useState<string>(String(5));
  const [heightInchesInput, setHeightInchesInput] = useState<string>(String(7));

  // Social profile fields
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [shareWorkoutStats, setShareWorkoutStats] = useState(true);
  const [usernameCheckStatus, setUsernameCheckStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  
  const { checkUsernameAvailable } = useSocialProfile();
  const totalSteps = 7; // Updated from 6 to 7 to include language step
  const progress = (currentStep / totalSteps) * 100;

  // Fallback nutrition goal estimator (client-side)
  const estimateGoals = (weightKg: number, heightCm: number, age: number, gender: 'male' | 'female' | 'other') => {
    const isMale = gender === 'male';
    const bmr = Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) + (isMale ? 5 : -161));
    const tdee = Math.round(bmr * 1.55); // moderate activity
    const protein_grams = Math.round((weightKg * 2.2) * 1.2); // 1.2g/lb
    const fat_grams = Math.round((tdee * 0.25) / 9);
    const carbs_grams = Math.max(0, Math.round((tdee - (protein_grams * 4) - (fat_grams * 9)) / 4));
    return { tdee, protein_grams, fat_grams, carbs_grams, bmr };
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

  // Helper: clamp to range
  const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

  // Validate and commit step 1 values from string inputs into numeric profile fields
  const commitBasicInfo = (): boolean => {
    // Parse
    const ageParsed = parseInt(ageInput || '', 10);
    const feetParsed = parseInt(heightFeetInput || '', 10);
    const inchesParsed = parseInt(heightInchesInput || '', 10);
    const weightParsed = parseFloat(weightLbsInput || '');

    // Validate presence
    if (isNaN(ageParsed)) {
      toast.error('Please enter your age');
      return false;
    }
    if (isNaN(feetParsed) || isNaN(inchesParsed)) {
      toast.error('Please enter your height in feet and inches');
      return false;
    }
    if (isNaN(weightParsed)) {
      toast.error('Please enter your weight in lbs');
      return false;
    }

    // Clamp to sensible ranges
    const age = clamp(ageParsed, 13, 100);
    const feet = clamp(feetParsed, 3, 9);
    const inches = clamp(inchesParsed, 0, 11);
    const weightLbs = clamp(weightParsed, 88, 440);

    // Compute derived metrics
    const heightCm = feetInchesToCm(feet, inches);
    const weightKg = lbsToKg(weightLbs);

    // Commit to profile
    setProfile(prev => ({
      ...prev,
      age,
      height_feet: feet,
      height_inches: inches,
      height_cm: heightCm,
      weight_lbs: weightLbs,
      weight_kg: weightKg,
    }));

    // Normalize UI inputs too
    setAgeInput(String(age));
    setHeightFeetInput(String(feet));
    setHeightInchesInput(String(inches));
    setWeightLbsInput(String(Math.round(weightLbs)));

    return true;
  };

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameCheckStatus('idle');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setUsernameCheckStatus('checking');
      const isAvailable = await checkUsernameAvailable(username);
      setUsernameCheckStatus(isAvailable ? 'available' : 'taken');
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, checkUsernameAvailable]);

  const validateUsername = (): boolean => {
    if (username.trim().length < 3) {
      toast.error('Username must be at least 3 characters');
      return false;
    }
    if (username.length > 20) {
      toast.error('Username must be less than 20 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error('Username can only contain letters, numbers, and underscores');
      return false;
    }
    if (usernameCheckStatus === 'taken') {
      toast.error('This username is already taken');
      return false;
    }
    if (usernameCheckStatus === 'checking') {
      toast.error('Please wait while we check username availability');
      return false;
    }
    return true;
  };

  const handleNext = async () => {
    // Handle language selection on step 1
    if (currentStep === 1) {
      await setLanguage(selectedLanguage);
    }
    
    // Validate step-specific input before moving on
    if (currentStep === 2) {
      const ok = commitBasicInfo();
      if (!ok) return;
    }
    
    if (currentStep === 7) {
      // Username is optional but if provided, must be valid
      if (username.trim() && !validateUsername()) {
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show smart weight recommendation instead of complete
      setShowSmartRecommendation(true);
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

      // Guard: ensure we have essential metrics - try to commit basic info first
      if (!profile.height_cm || !profile.weight_kg || profile.height_cm <= 0 || profile.weight_kg <= 0) {
        console.log('⚠️ Missing basic metrics, attempting to commit from inputs...');
        const committed = commitBasicInfo();
        if (!committed || !profile.height_cm || !profile.weight_kg) {
          // Let user proceed even if missing; mark onboarding complete and continue
          await supabase.from('profiles').upsert([{ id: user.id, onboarding_completed: true }], { onConflict: 'id' });
          toast.warning('Continuing without calibration. You can update your profile later.');
          onComplete();
          return;
        }
      }

      console.log('💾 Saving enhanced profile data:', profile);

      // Convert health fields to arrays as expected by database
      const healthConditionsArray = profile.health_conditions 
        ? [profile.health_conditions] 
        : null;
      const previousInjuriesArray = profile.previous_injuries 
        ? [profile.previous_injuries] 
        : null;

      // Update or insert profile with enhanced data to avoid "no row" edge cases
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{
          id: user.id,
          age: profile.age,
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm,
          gender: profile.gender,
          experience_level: profile.experience_level,
          primary_goal: profile.primary_goal,
          preferred_equipment_type: profile.preferred_equipment_type,
          diet_type: profile.diet_type,
          health_conditions: healthConditionsArray,
          previous_injuries: previousInjuriesArray,
          unit_preference: unitSystem,
          language_preference: selectedLanguage,
          username: username.trim() || null,
          bio: bio.trim() || null,
          is_profile_public: isProfilePublic,
          share_workout_stats: shareWorkoutStats,
          onboarding_completed: true
        }], { onConflict: 'id' });

      if (profileError) {
        console.error('❌ Error saving profile:', profileError);
        // Still allow user to continue
        toast.warning('Saved minimal profile. We will finish setup later.');
        onComplete();
        return;
      }

      console.log('✅ Profile saved successfully, starting calibration...');

      // Complete calibration process
      const { data: calibrationResult, error: calibrationError } = await supabase
        .rpc('complete_user_calibration', { _user_id: user.id });

      if (calibrationError || !calibrationResult) {
        console.error('❌ Calibration error or returned false:', calibrationError, calibrationResult);
        // Fallback: estimate client-side goals and mark calibration complete so user can proceed
        try {
          if (profile.weight_kg && profile.height_cm && profile.age) {
            const est = estimateGoals(profile.weight_kg, profile.height_cm, profile.age, profile.gender);
            await supabase.from('profiles').update({
              target_daily_calories: est.tdee,
              target_protein_grams: est.protein_grams,
              target_carbs_grams: est.carbs_grams,
              target_fat_grams: est.fat_grams,
              calibration_completed: true
            }).eq('id', user.id);
          } else {
            await supabase.from('profiles').update({ calibration_completed: true }).eq('id', user.id);
          }
          toast.warning('Setup complete. Calibration will be refined in the background.');
          onComplete();
          return;
        } catch (fallbackErr) {
          console.error('❌ Fallback calibration failed:', fallbackErr);
          // Last resort: mark flags to unblock UX
          await supabase.from('profiles').upsert([{ id: user.id, onboarding_completed: true, calibration_completed: true }], { onConflict: 'id' });
          toast.warning('Setup complete. You can adjust goals in settings.');
          onComplete();
          return;
        }
      }

      console.log('✅ Calibration completed successfully');
      toast.success('Profile setup complete! Your personalized workout plans are ready.');
      onComplete();
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      // Never block the user
      toast.warning('We hit a snag, but your setup can continue.');
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  // Handle smart recommendation completion
  const handleSmartRecommendationComplete = async () => {
    await handleComplete();
  };

  // Convert profile to UserWeightProfile format for smart recommendations
  const getUserWeightProfile = (): UserWeightProfile => {
    return {
      weight_lbs: profile.weight_lbs,
      age: profile.age,
      experience_level: profile.experience_level,
      primary_goal: profile.primary_goal,
      gender: profile.gender,
      current_max_weights: {}
    };
  };

  // Show smart weight recommendation screen
  if (showSmartRecommendation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <SmartWeightRecommendation
          userProfile={getUserWeightProfile()}
          onComplete={handleSmartRecommendationComplete}
        />
      </div>
    );
  }
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Globe className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">{t('onboarding.selectLanguage')}</h2>
              <p className="text-muted-foreground">{t('onboarding.selectLanguageDesc')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {supportedLanguages.map((lang) => (
                <Card
                  key={lang.code}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedLanguage === lang.code ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                  onClick={() => setSelectedLanguage(lang.code as SupportedLanguage)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <div className="font-semibold">{lang.nativeName}</div>
                      <div className="text-sm text-muted-foreground">{lang.name}</div>
                    </div>
                    {selectedLanguage === lang.code && (
                      <Check className="h-5 w-5 text-primary ml-auto" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <User className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">{t('onboarding.basicInfo')}</h2>
              <p className="text-muted-foreground">{t('onboarding.basicInfoDesc')}</p>
            </div>

            {/* Unit System Selector */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="h-4 w-4 text-primary" />
                <Label className="font-semibold">Measurement Units</Label>
              </div>
              <RadioGroup 
                value={unitSystem} 
                onValueChange={(value) => setUnitSystem(value as UnitSystem)}
                className="grid grid-cols-2 gap-3"
              >
                <div className="flex items-center space-x-2 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="imperial" id="unit-imperial" />
                  <Label htmlFor="unit-imperial" className="cursor-pointer flex-1">
                    <div className="font-medium">Imperial</div>
                    <div className="text-xs text-muted-foreground">lbs, ft, in</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-md border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="metric" id="unit-metric" />
                  <Label htmlFor="unit-metric" className="cursor-pointer flex-1">
                    <div className="font-medium">Metric</div>
                    <div className="text-xs text-muted-foreground">kg, cm</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={ageInput}
                  onChange={(e) => {
                    // Allow digits only
                    const next = e.target.value.replace(/\D/g, '');
                    setAgeInput(next);
                  }}
                  placeholder="e.g. 28"
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

            {unitSystem === 'imperial' ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\\.?[0-9]*"
                    value={weightLbsInput}
                    onChange={(e) => {
                      let v = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = v.split('.');
                      if (parts.length > 2) {
                        v = parts[0] + '.' + parts.slice(1).join('');
                      }
                      setWeightLbsInput(v);
                    }}
                    placeholder="e.g. 165.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height-feet">Height (feet)</Label>
                  <Input
                    id="height-feet"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={heightFeetInput}
                    onChange={(e) => setHeightFeetInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height-inches">Height (inches)</Label>
                  <Input
                    id="height-inches"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={heightInchesInput}
                    onChange={(e) => setHeightInchesInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 7"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight-kg">Weight (kg)</Label>
                  <Input
                    id="weight-kg"
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\\.?[0-9]*"
                    value={profile.weight_kg ? profile.weight_kg.toFixed(1) : ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        handleInputChange('weight_kg', val);
                      }
                    }}
                    placeholder="e.g. 75.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height-cm">Height (cm)</Label>
                  <Input
                    id="height-cm"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={profile.height_cm ? Math.round(profile.height_cm) : ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) {
                        handleInputChange('height_cm', val);
                      }
                    }}
                    placeholder="e.g. 175"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Target className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">{t('onboarding.fitnessGoals')}</h2>
              <p className="text-muted-foreground">{t('onboarding.fitnessGoalsDesc')}</p>
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

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Dumbbell className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">{t('onboarding.experienceLevel')}</h2>
              <p className="text-muted-foreground">{t('onboarding.experienceLevelDesc')}</p>
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

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Calendar className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">{t('onboarding.equipment')}</h2>
              <p className="text-muted-foreground">{t('onboarding.equipmentDesc')}</p>
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

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">{t('onboarding.healthSafety')}</h2>
              <p className="text-muted-foreground">{t('onboarding.healthSafetyDesc')}</p>
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
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <AtSign className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">{t('onboarding.socialProfile')}</h2>
              <p className="text-muted-foreground">{t('onboarding.socialProfileDesc')}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username (Optional)</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="e.g. fitness_warrior"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    maxLength={20}
                    className="pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameCheckStatus === 'checking' && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {usernameCheckStatus === 'available' && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {usernameCheckStatus === 'taken' && (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  3-20 characters, letters, numbers, and underscores only
                </p>
                {usernameCheckStatus === 'available' && username.length >= 3 && (
                  <p className="text-xs text-green-500">✓ Username is available!</p>
                )}
                {usernameCheckStatus === 'taken' && (
                  <p className="text-xs text-destructive">✗ Username is already taken</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell others about your fitness journey..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/160 characters
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">Privacy Settings</h3>
                
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="public-profile" className="cursor-pointer">
                      Public Profile
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to find and view your profile
                    </p>
                  </div>
                  <Switch
                    id="public-profile"
                    checked={isProfilePublic}
                    onCheckedChange={setIsProfilePublic}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="share-workouts" className="cursor-pointer">
                      Share Workout Stats
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Let followers see your workout progress
                    </p>
                  </div>
                  <Switch
                    id="share-workouts"
                    checked={shareWorkoutStats}
                    onCheckedChange={setShareWorkoutStats}
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold text-sm">💡 Why create a username?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Connect with other fitness enthusiasts</li>
                  <li>• Share your progress and achievements</li>
                  <li>• Find workout buddies and motivation</li>
                  <li>• Join challenges and compete on leaderboards</li>
                </ul>
                <p className="text-xs text-muted-foreground pt-2">
                  You can always add or change your username later in settings
                </p>
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
              {t('common.back')}
            </Button>
            <Button 
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? t('common.loading') : currentStep === totalSteps ? t('onboarding.completeSetup') : t('common.next')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedOnboarding;
