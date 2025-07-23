import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trophy, 
  Clock, 
  Target, 
  Activity, 
  Star,
  Home,
  Repeat,
  Share2
} from "lucide-react";
import { useTapCoins } from "@/hooks/useTapCoins";
import { toast } from "sonner";

const WorkoutSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { awardCoins } = useTapCoins();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const workoutData = location.state?.workoutData || {
    name: "Workout",
    exercises: 0,
    duration: 0,
    sets: 0,
    notes: ""
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    try {
      // Award coins based on total reps (100 reps = 1 tap coin)
      // Estimate total reps from sets completed (assuming ~10 reps per set)
      const estimatedReps = workoutData.sets * 10;
      const totalCoins = Math.floor(estimatedReps / 100);

      await awardCoins(
        totalCoins, 
        'earn_workout', 
        `Completed ${workoutData.name} workout (${estimatedReps} reps)`
      );

      setSubmitted(true);
      toast.success(`Workout logged! Earned ${totalCoins} Tap Coins 🎉`);
    } catch (error) {
      console.error('Error submitting workout feedback:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'TapFit Workout Complete!',
        text: `Just completed a ${workoutData.name} workout! ${workoutData.exercises} exercises in ${workoutData.duration} minutes 💪`,
        url: window.location.origin
      });
    } else {
      // Fallback to copying to clipboard
      const shareText = `Just completed a ${workoutData.name} workout! ${workoutData.exercises} exercises in ${workoutData.duration} minutes 💪`;
      navigator.clipboard.writeText(shareText);
      toast.success('Workout summary copied to clipboard!');
    }
  };

  // Estimated calories (rough calculation)
  const estimatedCalories = Math.round(workoutData.duration * 8 + workoutData.sets * 2);

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Workout Complete!</h1>
        <p className="text-muted-foreground">Great job on finishing your {workoutData.name} workout</p>
      </div>

      {/* Workout Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="metric-card animate-fade-in">
          <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{estimatedCalories}</p>
          <p className="text-sm text-muted-foreground">Calories Burned</p>
        </Card>

        <Card className="metric-card animate-fade-in">
          <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{workoutData.duration}m</p>
          <p className="text-sm text-muted-foreground">Duration</p>
        </Card>

        <Card className="metric-card animate-fade-in">
          <Target className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{workoutData.exercises}</p>
          <p className="text-sm text-muted-foreground">Exercises</p>
        </Card>

        <Card className="metric-card animate-fade-in">
          <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{workoutData.sets}</p>
          <p className="text-sm text-muted-foreground">Sets Completed</p>
        </Card>
      </div>

      {/* Achievement Badges */}
      <Card className="glow-card p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Achievements</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="bg-green-500">
            <Trophy className="h-3 w-3 mr-1" />
            Workout Completed
          </Badge>
          {workoutData.sets >= 15 && (
            <Badge variant="secondary">
              <Target className="h-3 w-3 mr-1" />
              Volume King
            </Badge>
          )}
          {workoutData.duration >= 45 && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Endurance Star
            </Badge>
          )}
          <Badge variant="outline">
            +{Math.floor((workoutData.sets * 10) / 100)} Tap Coins
          </Badge>
        </div>
      </Card>

      {/* Workout Rating */}
      {!submitted ? (
        <Card className="glow-card p-6">
          <h3 className="text-lg font-semibold mb-4">Rate Your Workout</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-3">How did this workout feel?</p>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-2 rounded-full transition-colors ${
                      star <= rating 
                        ? 'text-yellow-500 bg-yellow-500/10' 
                        : 'text-muted-foreground hover:text-yellow-500'
                    }`}
                  >
                    <Star className={`h-6 w-6 ${star <= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
              <div className="text-center mt-2">
                <p className="text-sm text-muted-foreground">
                  {rating === 0 && "Click to rate"}
                  {rating === 1 && "Too easy"}
                  {rating === 2 && "Easy"}
                  {rating === 3 && "Just right"}
                  {rating === 4 && "Challenging"}
                  {rating === 5 && "Very challenging"}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional feedback (optional)
              </label>
              <Textarea
                placeholder="How did you feel during the workout? Any exercises that were particularly challenging or easy?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-20"
              />
            </div>

            <Button 
              onClick={handleRatingSubmit}
              className="w-full"
              disabled={rating === 0}
            >
              Submit Rating & Earn Coins
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="glow-card p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
          <p className="text-muted-foreground">
            Your feedback helps us improve your workout experience.
          </p>
        </Card>
      )}

      {/* Workout Notes */}
      {workoutData.notes && (
        <Card className="glow-card p-6">
          <h3 className="text-lg font-semibold mb-3">Your Notes</h3>
          <div className="bg-background/50 p-3 rounded-lg">
            <p className="text-sm">{workoutData.notes}</p>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          onClick={handleShare}
          className="h-12"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate('/workout-list')}
          className="h-12"
        >
          <Repeat className="h-4 w-4 mr-2" />
          View Workouts
        </Button>
        
        <Button 
          onClick={() => navigate('/')}
          className="h-12"
        >
          <Home className="h-4 w-4 mr-2" />
          Dashboard
        </Button>
      </div>

      {/* Next Workout Preview */}
      <Card className="glow-card p-6">
        <h3 className="text-lg font-semibold mb-3">What's Next?</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Tomorrow's Focus</p>
            <p className="text-sm text-muted-foreground">Rest day - Recovery is key! 💤</p>
          </div>
          <Button variant="outline" size="sm">
            View Schedule
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default WorkoutSummary;