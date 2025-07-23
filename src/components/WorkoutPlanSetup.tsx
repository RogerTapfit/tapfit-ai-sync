import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Brain, Clock, Target, Calendar, AlertTriangle, Dumbbell } from 'lucide-react';
import { useWorkoutPlan, FitnessPreferences } from '@/hooks/useWorkoutPlan';

const WorkoutPlanSetup = () => {
  const { preferences, savePreferences, generateNewPlan, loading } = useWorkoutPlan();
  const [formData, setFormData] = useState<FitnessPreferences>(
    preferences || {
      current_fitness_level: 'beginner',
      primary_goal: 'general_fitness',
      workout_frequency: 3,
      session_duration_preference: 45,
      available_days: ['monday', 'wednesday', 'friday'],
      preferred_time_slots: ['18:00'],
      equipment_restrictions: [],
      health_conditions: []
    }
  );

  const fitnessGoals = [
    { value: 'build_muscle', label: 'Build Muscle', icon: '💪' },
    { value: 'burn_fat', label: 'Burn Fat', icon: '🔥' },
    { value: 'tone', label: 'Tone & Define', icon: '✨' },
    { value: 'increase_endurance', label: 'Increase Endurance', icon: '🏃' },
    { value: 'general_fitness', label: 'General Fitness', icon: '🌟' }
  ];

  const daysOfWeek = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  // Format time to AM/PM format
  const formatTimeAMPM = (timeString: string) => {
    try {
      const date = new Date(`2000-01-01T${timeString}`);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } catch {
      return timeString;
    }
  };

  const handleDayToggle = (day: string) => {
    const updatedDays = formData.available_days.includes(day)
      ? formData.available_days.filter(d => d !== day)
      : [...formData.available_days, day];
    
    setFormData({ ...formData, available_days: updatedDays });
  };

  const handleTimeToggle = (time: string) => {
    const updatedTimes = formData.preferred_time_slots.includes(time)
      ? formData.preferred_time_slots.filter(t => t !== time)
      : [...formData.preferred_time_slots, time];
    
    setFormData({ ...formData, preferred_time_slots: updatedTimes });
  };

  const handleSaveAndGenerate = async () => {
    await savePreferences(formData);
    await generateNewPlan();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Workout Plan Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fitness Goal */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Primary Fitness Goal
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {fitnessGoals.map((goal) => (
                <Button
                  key={goal.value}
                  variant={formData.primary_goal === goal.value ? "default" : "outline"}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                  onClick={() => setFormData({ ...formData, primary_goal: goal.value as any })}
                >
                  <span className="text-2xl">{goal.icon}</span>
                  <span className="text-sm text-center">{goal.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Fitness Level */}
          <div className="space-y-3">
            <Label>Current Fitness Level</Label>
            <Select 
              value={formData.current_fitness_level} 
              onValueChange={(value: any) => setFormData({ ...formData, current_fitness_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner (0-6 months)</SelectItem>
                <SelectItem value="intermediate">Intermediate (6 months - 2 years)</SelectItem>
                <SelectItem value="advanced">Advanced (2+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Workout Frequency & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Workouts per Week
              </Label>
              <Select 
                value={formData.workout_frequency.toString()} 
                onValueChange={(value) => setFormData({ ...formData, workout_frequency: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 times per week</SelectItem>
                  <SelectItem value="3">3 times per week</SelectItem>
                  <SelectItem value="4">4 times per week</SelectItem>
                  <SelectItem value="5">5 times per week</SelectItem>
                  <SelectItem value="6">6 times per week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Session Duration (minutes)
              </Label>
              <Input
                type="number"
                min="20"
                max="120"
                value={formData.session_duration_preference}
                onChange={(e) => setFormData({ ...formData, session_duration_preference: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Available Days */}
          <div className="space-y-3">
            <Label>Available Days</Label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <Badge
                  key={day}
                  variant={formData.available_days.includes(day) ? "default" : "outline"}
                  className="cursor-pointer px-3 py-2"
                  onClick={() => handleDayToggle(day)}
                >
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Preferred Times */}
          <div className="space-y-3">
            <Label>Preferred Time Slots</Label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {timeSlots.map((time) => (
                <Badge
                  key={time}
                  variant={formData.preferred_time_slots.includes(time) ? "default" : "outline"}
                  className="cursor-pointer px-2 py-1 text-center"
                  onClick={() => handleTimeToggle(time)}
                >
                  {formatTimeAMPM(time)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Equipment Restrictions */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              Equipment to Avoid (optional)
            </Label>
            <Textarea
              placeholder="e.g., rowing machine, treadmill, etc."
              value={formData.equipment_restrictions?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                equipment_restrictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
            />
          </div>

          {/* Health Conditions */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Health Conditions / Injuries (optional)
            </Label>
            <Textarea
              placeholder="e.g., knee injury, back problems, etc."
              value={formData.health_conditions?.join(', ') || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                health_conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              })}
            />
          </div>

          <Button 
            onClick={handleSaveAndGenerate} 
            disabled={loading || formData.available_days.length === 0}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>Generating AI Plan...</>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate AI Workout Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutPlanSetup;