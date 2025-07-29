import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Clock, Target, Calendar, AlertTriangle, Dumbbell, Zap, Heart, Users, Settings } from 'lucide-react';
import { useWorkoutPlan, FitnessPreferences } from '@/hooks/useWorkoutPlan';

const WorkoutPlanSetup = () => {
  const { preferences, savePreferences, generateNewPlan, loading } = useWorkoutPlan();
  const [formData, setFormData] = useState<FitnessPreferences>(
    preferences || {
      current_fitness_level: 'beginner',
      primary_goal: 'muscle_building',
      workout_frequency: 5,
      session_duration_preference: 60,
      available_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      preferred_time_slots: ['18:00'],
      equipment_restrictions: [],
      health_conditions: [],
      target_muscle_groups: ['chest', 'back', 'shoulders', 'legs'],
      available_equipment: [],
      preferred_workout_time: 'evening'
    }
  );

  const fitnessGoals = [
    { value: 'muscle_building', label: 'Muscle Building', icon: '💪' },
    { value: 'fat_loss', label: 'Fat Loss', icon: '🔥' },
    { value: 'toning', label: 'Toning & Definition', icon: '✨' },
    { value: 'endurance', label: 'Endurance', icon: '🏃' },
    { value: 'general_fitness', label: 'General Fitness', icon: '🌟' }
  ];

  const muscleGroups = [
    { value: 'chest', label: 'Chest', icon: '💪' },
    { value: 'back', label: 'Back', icon: '⬅️' },
    { value: 'shoulders', label: 'Shoulders', icon: '🤝' },
    { value: 'legs', label: 'Legs', icon: '🦵' },
    { value: 'glutes', label: 'Glutes', icon: '🍑' },
    { value: 'abs', label: 'Abs/Core', icon: '💎' },
    { value: 'arms', label: 'Arms', icon: '💪' }
  ];

  const gymEquipment = [
    { value: 'chest_press', label: 'Chest Press Machine', category: 'chest' },
    { value: 'shoulder_press', label: 'Shoulder Press Machine', category: 'shoulders' },
    { value: 'lat_pulldown', label: 'Lat Pulldown', category: 'back' },
    { value: 'seated_row', label: 'Seated Row', category: 'back' },
    { value: 'leg_press', label: 'Leg Press', category: 'legs' },
    { value: 'leg_extension', label: 'Leg Extension', category: 'legs' },
    { value: 'leg_curl', label: 'Leg Curl', category: 'legs' },
    { value: 'smith_machine', label: 'Smith Machine', category: 'full_body' },
    { value: 'cable_machine', label: 'Cable Machine', category: 'full_body' },
    { value: 'ab_crunch_machine', label: 'Ab Crunch Machine', category: 'abs' },
    { value: 'hip_abduction', label: 'Hip Abduction Machine', category: 'glutes' },
    { value: 'glute_kickback', label: 'Glute Kickback Machine', category: 'glutes' },
    { value: 'treadmill', label: 'Treadmill', category: 'cardio' },
    { value: 'stairmaster', label: 'Stairmaster', category: 'cardio' },
    { value: 'airbike', label: 'Air Bike', category: 'cardio' },
    { value: 'rowing_machine', label: 'Rowing Machine', category: 'cardio' },
    { value: 'elliptical', label: 'Elliptical', category: 'cardio' },
    { value: 'incline_press', label: 'Incline Press', category: 'chest' },
    { value: 'pec_deck', label: 'Pec Deck Fly', category: 'chest' },
    { value: 'tricep_dips', label: 'Tricep Dip Machine', category: 'arms' },
    { value: 'bicep_curl', label: 'Bicep Curl Machine', category: 'arms' },
    { value: 'preacher_curl', label: 'Preacher Curl', category: 'arms' }
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

  const handleMuscleGroupToggle = (muscleGroup: string) => {
    const current = formData.target_muscle_groups || [];
    const updated = current.includes(muscleGroup)
      ? current.filter(mg => mg !== muscleGroup)
      : [...current, muscleGroup];
    
    setFormData({ ...formData, target_muscle_groups: updated });
  };

  const handleEquipmentToggle = (equipment: string) => {
    const current = formData.available_equipment || [];
    const updated = current.includes(equipment)
      ? current.filter(eq => eq !== equipment)
      : [...current, equipment];
    
    setFormData({ ...formData, available_equipment: updated });
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
            5-Day Gym Workout Plan Builder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basics" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Basics
              </TabsTrigger>
              <TabsTrigger value="muscle-groups" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Muscle Groups
              </TabsTrigger>
              <TabsTrigger value="equipment" className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4" />
                Equipment
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basics" className="space-y-6 mt-6">
              {/* Primary Goal */}
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

              {/* Experience Level */}
              <div className="space-y-3">
                <Label>Experience Level</Label>
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

              {/* Workout Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <Label>Days per Week</Label>
                  <Select 
                    value={formData.workout_frequency.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, workout_frequency: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day per week</SelectItem>
                      <SelectItem value="2">2 days per week</SelectItem>
                      <SelectItem value="3">3 days per week</SelectItem>
                      <SelectItem value="4">4 days per week</SelectItem>
                      <SelectItem value="5">5 days per week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Session Duration</Label>
                  <Input
                    type="number"
                    min="30"
                    max="120"
                    value={formData.session_duration_preference}
                    onChange={(e) => setFormData({ ...formData, session_duration_preference: parseInt(e.target.value) })}
                    placeholder="Minutes"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Preferred Time</Label>
                  <Select 
                    value={formData.preferred_workout_time || 'evening'} 
                    onValueChange={(value: any) => setFormData({ ...formData, preferred_workout_time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (AM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon</SelectItem>
                      <SelectItem value="evening">Evening (PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Health Conditions */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Health Conditions / Injuries (optional)
                </Label>
                <Textarea
                  placeholder="e.g., knee injury, back problems, shoulder issues..."
                  value={formData.health_conditions?.join(', ') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    health_conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                />
              </div>
            </TabsContent>

            <TabsContent value="muscle-groups" className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Target Muscle Groups
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select the muscle groups you want to focus on in your workout plan.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {muscleGroups.map((group) => (
                    <Button
                      key={group.value}
                      variant={(formData.target_muscle_groups || []).includes(group.value) ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => handleMuscleGroupToggle(group.value)}
                    >
                      <span className="text-2xl">{group.icon}</span>
                      <span className="text-sm text-center">{group.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="equipment" className="space-y-6 mt-6">
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Available Equipment
                </Label>
                <p className="text-sm text-muted-foreground">
                  Select equipment available at your gym (24 Hour Fitness standard equipment).
                </p>
                
                {/* Equipment by Category */}
                {['chest', 'back', 'shoulders', 'legs', 'glutes', 'arms', 'abs', 'cardio', 'full_body'].map(category => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium capitalize">{category === 'full_body' ? 'Full Body' : category}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {gymEquipment
                        .filter(eq => eq.category === category)
                        .map((equipment) => (
                          <Badge
                            key={equipment.value}
                            variant={(formData.available_equipment || []).includes(equipment.value) ? "default" : "outline"}
                            className="cursor-pointer px-3 py-2 text-center justify-center"
                            onClick={() => handleEquipmentToggle(equipment.value)}
                          >
                            {equipment.label}
                          </Badge>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Equipment to Avoid */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Equipment to Avoid (optional)
                </Label>
                <Textarea
                  placeholder="e.g., rowing machine, specific machines due to injury..."
                  value={formData.equipment_restrictions?.join(', ') || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    equipment_restrictions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                />
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6 mt-6">
              {/* Available Days */}
              <div className="space-y-3">
                <Label>Available Days</Label>
                <p className="text-sm text-muted-foreground">
                  Select the days you're available to work out.
                </p>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => (
                    <Badge
                      key={day}
                      variant={formData.available_days.includes(day) ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2"
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
                <p className="text-sm text-muted-foreground">
                  Select your preferred workout times.
                </p>
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
            </TabsContent>
          </Tabs>

          <div className="mt-8 pt-6 border-t">
            <Button 
              onClick={handleSaveAndGenerate} 
              disabled={loading || formData.available_days.length === 0 || (formData.target_muscle_groups || []).length === 0}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Settings className="mr-2 h-4 w-4 animate-spin" />
                  Generating Your Custom 5-Day Plan...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Generate My 5-Day Workout Plan
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutPlanSetup;