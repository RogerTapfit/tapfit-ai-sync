import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Zap, ArrowLeft, Camera, List } from 'lucide-react';

export const WorkoutModeSelect: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-safe">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Start Workout</h1>
            <p className="text-muted-foreground">Choose your workout style</p>
          </div>
        </div>

        {/* Workout Mode Options */}
        <div className="grid gap-6">
          {/* Scheduled Workout Card */}
          <Card 
            className="glow-card cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50"
            onClick={() => navigate('/workout-list')}
          >
            <div className="p-8">
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-2xl bg-primary/20 shadow-glow">
                  <Calendar className="h-12 w-12 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    Scheduled Workout
                    <List className="h-5 w-5 text-muted-foreground" />
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Follow your AI-generated workout plan for today. Pre-planned exercises based on your training schedule and muscle groups.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      ✓ Pre-planned
                    </span>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      ✓ Balanced routine
                    </span>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      ✓ Muscle group focus
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Custom Workout Card */}
          <Card 
            className="glow-card cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50"
            onClick={() => navigate('/workout-list?mode=custom')}
          >
            <div className="p-8">
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-glow">
                  <Zap className="h-12 w-12 text-orange-500" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    Custom Workout
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Build your own workout by scanning machines as you go. Perfect for free-form training and trying new exercises.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
                      ✓ Scan-as-you-go
                    </span>
                    <span className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
                      ✓ Full flexibility
                    </span>
                    <span className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium">
                      ✓ Explore freely
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Hybrid Tip */}
        <Card className="bg-muted/50 border-dashed">
          <div className="p-6">
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span>
                <strong>Pro Tip:</strong> You can also take a hybrid approach! Start with a scheduled workout and scan additional machines to add more exercises to your session.
              </span>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WorkoutModeSelect;
