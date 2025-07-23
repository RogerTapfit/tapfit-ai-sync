import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dumbbell, Target, Zap } from 'lucide-react';

const onboardingSchema = z.object({
  weight_kg: z.number().min(30, 'Weight must be at least 30kg').max(300, 'Weight must be less than 300kg'),
  height_cm: z.number().min(100, 'Height must be at least 100cm').max(250, 'Height must be less than 250cm'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  diet_type: z.enum(['vegan', 'omnivore', 'special_diet']),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

interface OnboardingFlowProps {
  userId: string;
  onComplete: () => void;
}

export function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [calibrationData, setCalibrationData] = useState<any>(null);
  const navigate = useNavigate();

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      diet_type: 'omnivore',
    },
  });

  const onSubmit = async (data: OnboardingData) => {
    setLoading(true);
    try {
      // Update profile with biometric data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          weight_kg: data.weight_kg,
          height_cm: data.height_cm,
          gender: data.gender,
          diet_type: data.diet_type,
          onboarding_completed: true,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Complete calibration
      const { data: calibrationResult, error: calibrationError } = await supabase
        .rpc('complete_user_calibration', {
          _user_id: userId
        });

      if (calibrationError) throw calibrationError;

      // Get the updated profile with nutrition goals
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('target_daily_calories, target_protein_grams, target_carbs_grams, target_fat_grams')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      setCalibrationData(profile);
      setStep(2);
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    toast.success('Welcome to TapFit! Your Power Level: 200 - Let\'s level up!');
    onComplete();
    navigate('/');
  };

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Calibration Complete!</CardTitle>
            <CardDescription>
              Your personalized fitness profile is ready
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">Power Level: 200</div>
                <div className="text-sm text-muted-foreground">Starting Tier: Inconsistent</div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Your Daily Goals
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Calories</div>
                    <div className="font-semibold">{calibrationData?.target_daily_calories}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Protein</div>
                    <div className="font-semibold">{calibrationData?.target_protein_grams}g</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Carbs</div>
                    <div className="font-semibold">{calibrationData?.target_carbs_grams}g</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fat</div>
                    <div className="font-semibold">{calibrationData?.target_fat_grams}g</div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Ready to Level Up?</h4>
                <p className="text-sm text-muted-foreground">
                  Complete workouts, log meals, and take on challenges to increase your Power Level!
                </p>
              </div>
            </div>

            <Button onClick={handleComplete} className="w-full" size="lg">
              Start Your Fitness Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Help us personalize your fitness experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="70"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="175"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender (optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diet_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diet Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select diet type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="omnivore">Omnivore</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="special_diet">Special Diet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Setting Up...' : 'Complete Setup'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}