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
import EnhancedOnboarding from './EnhancedOnboarding';

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
  // Use enhanced onboarding with AI weight calculations
  return <EnhancedOnboarding onComplete={onComplete} />;
}