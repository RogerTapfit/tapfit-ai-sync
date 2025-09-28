import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RealTimeRepCounter } from '@/components/RealTimeRepCounter';
import { MachineRegistryService } from '@/services/machineRegistryService';
import { useWeightRecommendation } from '@/hooks/useWeightRecommendation';
import { ArrowLeft, Info, Settings, Dumbbell } from 'lucide-react';

export default function MachineWorkout() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const machine = workoutId ? MachineRegistryService.getMachineByWorkoutId(workoutId) : null;
  
  // Get personalized weight recommendations
  const { 
    recommendation, 
    loading: recommendationLoading, 
    getConfidenceColor, 
    getConfidenceDescription 
  } = useWeightRecommendation({
    exerciseName: machine?.type || 'chest_press',
    machineName: machine?.name || '',
    muscleGroup: machine?.muscleGroup || 'chest'
  });

  if (!machine) {
    return (
      <div className="container max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Machine not found</p>
            <Button onClick={() => navigate('/workout-list')} className="mt-4">
              Back to Workouts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleWorkoutComplete = () => {
    const sets = recommendation?.sets || 3;
    const reps = recommendation?.reps || 12;
    
    navigate('/workout-summary', { 
      state: { 
        machineId: machine.id, 
        machineName: machine.name,
        completedSets: sets,
        totalReps: sets * reps,
        recommendedWeight: recommendation?.recommended_weight
      }
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/workout-list')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{machine.name}</h1>
          <p className="text-muted-foreground">{machine.type} Machine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Info */}
        <div className="lg:col-span-1 space-y-4">
          {/* Machine Image */}
          <Card>
            <CardContent className="p-4">
              {(location.state?.aiSelectedImageUrl || machine.imageUrl) && (
                <div className="w-full h-64 bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={location.state?.fromScan && location.state?.aiSelectedImageUrl 
                      ? location.state.aiSelectedImageUrl 
                      : machine.imageUrl
                    } 
                    alt={machine.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Machine Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge variant="secondary">{machine.muscleGroup}</Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Target Sets:</span>
                  <span className="text-sm">{recommendation?.sets || 3}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Reps per Set:</span>
                  <span className="text-sm">{recommendation?.reps || 12}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Rest Time:</span>
                  <span className="text-sm">{recommendation?.rest_seconds || 60}s</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weight Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Recommended Weight
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendationLoading ? (
                <div className="text-center text-muted-foreground">
                  Calculating...
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {recommendation?.recommended_weight || 80} lbs
                    </div>
                    <div className={`text-sm ${getConfidenceColor(recommendation?.confidence || 'learning')}`}>
                      {getConfidenceDescription(recommendation?.confidence || 'learning')}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-center">
                    Based on your profile and experience level
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Follow proper form and controlled movements. Start with a comfortable weight and focus on technique.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rep Counter */}
        <div className="lg:col-span-2">
          <RealTimeRepCounter
            targetReps={recommendation?.reps || 12}
            targetSets={recommendation?.sets || 3}
            onWorkoutComplete={handleWorkoutComplete}
          />
        </div>
      </div>
    </div>
  );
}