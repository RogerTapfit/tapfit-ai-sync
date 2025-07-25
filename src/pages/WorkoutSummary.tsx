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
  Share2,
  Coins
} from "lucide-react";
import { useTapCoins } from "@/hooks/useTapCoins";
import { toast } from "sonner";
import { AnimatedCoinCounter } from "@/components/AnimatedCoinCounter";
import { AnimatedNumber } from "@/components/AnimatedNumber";

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
    totalReps: 0,
    notes: "",
    allWorkoutsCompleted: false // Track if all daily workouts are done
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    try {
      // Calculate total coins including review bonus
      const baseSubtotal = 
        0.5 + // Base completion
        ((workoutData.totalReps || workoutData.sets * 10) * 0.01) + // Reps
        (workoutData.duration >= 30 ? 0.25 : 0) + // Duration bonus
        (workoutData.sets >= 15 ? 0.1 : 0) + // Volume bonus
        (workoutData.duration >= 45 ? 0.15 : 0) + // Endurance bonus
        ((workoutData.totalReps || 0) >= 100 ? 0.2 : 0) + // Century bonus
        (workoutData.exercises >= 5 ? 0.08 : 0); // Multi-exercise bonus

      const reviewBonus = 0.1; // Review bonus
      const subtotalWithReview = baseSubtotal + reviewBonus;
      const finalTotal = subtotalWithReview * (workoutData.allWorkoutsCompleted ? 2 : 1);
      
      // Convert to integer for database (multiply by 1000 to store fractional coins)
      const coinsToAward = Math.round(finalTotal * 1000);

      await awardCoins(
        coinsToAward, 
        'earn_workout', 
        `Completed ${workoutData.name} workout and left review (${finalTotal.toFixed(3)} coins)`
      );

      setSubmitted(true);
      toast.success(`Workout logged! Earned ${finalTotal.toFixed(3)} Tap Coins 🎉`);
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
  const estimatedCalories = Math.round(workoutData.duration * 8 + (workoutData.totalReps || workoutData.sets * 10) * 0.5);

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
          <p className="text-2xl">
            <AnimatedNumber finalValue={estimatedCalories} duration={2700} />
          </p>
          <p className="text-sm text-muted-foreground">Calories Burned</p>
        </Card>

        <Card className="metric-card animate-fade-in">
          <Target className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl">
            <AnimatedNumber finalValue={workoutData.totalReps || workoutData.sets * 10} duration={3000} />
          </p>
          <p className="text-sm text-muted-foreground">Total Reps</p>
        </Card>

        <Card className="metric-card animate-fade-in">
          <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl">
            <AnimatedNumber finalValue={workoutData.duration} duration={2400} suffix="m" />
          </p>
          <p className="text-sm text-muted-foreground">Duration</p>
        </Card>

        <Card className="metric-card animate-fade-in">
          <Target className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl">
            <AnimatedNumber finalValue={workoutData.exercises} duration={2100} />
          </p>
          <p className="text-sm text-muted-foreground">Exercises</p>
        </Card>

        <Card className="metric-card animate-fade-in">
          <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="text-2xl">
            <AnimatedNumber finalValue={workoutData.sets} duration={3300} />
          </p>
          <p className="text-sm text-muted-foreground">Sets Completed</p>
        </Card>
      </div>

      {/* Achievement Badges */}
      <Card className="glow-card p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Achievements</h3>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="bg-green-500">
              <Trophy className="h-3 w-3 mr-1" />
              Workout Completed
            </Badge>
            {workoutData.allWorkoutsCompleted && (
              <Badge variant="default" className="bg-gradient-to-r from-gold-500 to-yellow-600 text-white animate-pulse">
                <Star className="h-3 w-3 mr-1" />
                Daily Goal Complete! (x2 Bonus)
              </Badge>
            )}
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
            {(workoutData.totalReps || 0) >= 100 && (
              <Badge variant="secondary" className="bg-purple-500">
                <Trophy className="h-3 w-3 mr-1" />
                Century Club
              </Badge>
            )}
            {workoutData.exercises >= 5 && (
              <Badge variant="secondary" className="bg-blue-500">
                <Target className="h-3 w-3 mr-1" />
                Multi-Exercise Master
              </Badge>
            )}
          </div>
          
          {/* Detailed Coin Breakdown */}
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              Tap Coins Earned This Workout
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span>Workout Completion</span>
                <span className="font-medium text-yellow-600">+0.5 coins</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Reps Completed ({workoutData.totalReps || workoutData.sets * 10})</span>
                <span className="font-medium text-yellow-600">+{((workoutData.totalReps || workoutData.sets * 10) * 0.01).toFixed(3)} coins</span>
              </div>
              {workoutData.duration >= 30 && (
                <div className="flex justify-between items-center">
                  <span>Duration Bonus (30+ mins)</span>
                  <span className="font-medium text-yellow-600">+0.25 coins</span>
                </div>
              )}
              {workoutData.sets >= 15 && (
                <div className="flex justify-between items-center">
                  <span>Volume King Bonus</span>
                  <span className="font-medium text-yellow-600">+0.1 coins</span>
                </div>
              )}
              {workoutData.duration >= 45 && (
                <div className="flex justify-between items-center">
                  <span>Endurance Star Bonus</span>
                  <span className="font-medium text-yellow-600">+0.15 coins</span>
                </div>
              )}
              {(workoutData.totalReps || 0) >= 100 && (
                <div className="flex justify-between items-center">
                  <span>Century Club Bonus</span>
                  <span className="font-medium text-yellow-600">+0.2 coins</span>
                </div>
              )}
              {workoutData.exercises >= 5 && (
                <div className="flex justify-between items-center">
                  <span>Multi-Exercise Bonus</span>
                  <span className="font-medium text-yellow-600">+0.08 coins</span>
                </div>
               )}
              <div className="flex justify-between items-center">
                <span>Review Bonus (leave rating)</span>
                <span className="font-medium text-yellow-600">+0.10 coins</span>
              </div>
              <hr className="border-yellow-500/30" />
              <div className="flex justify-between items-center font-medium">
                <span>Subtotal</span>
                <span className="text-yellow-600">
                  +{(
                    0.5 + // Base completion
                    ((workoutData.totalReps || workoutData.sets * 10) * 0.01) + // Reps
                    (workoutData.duration >= 30 ? 0.25 : 0) + // Duration bonus
                    (workoutData.sets >= 15 ? 0.1 : 0) + // Volume bonus
                    (workoutData.duration >= 45 ? 0.15 : 0) + // Endurance bonus
                    ((workoutData.totalReps || 0) >= 100 ? 0.2 : 0) + // Century bonus
                    (workoutData.exercises >= 5 ? 0.08 : 0) + // Multi-exercise bonus
                    0.1 // Review bonus
                  ).toFixed(3)} coins
                </span>
              </div>
              {workoutData.allWorkoutsCompleted && (
                <div className="flex justify-between items-center">
                  <span className="text-orange-600 font-medium">🎉 Daily Goal Complete Bonus (x2)</span>
                  <span className="font-medium text-orange-600">+{(
                    0.5 + // Base completion
                    ((workoutData.totalReps || workoutData.sets * 10) * 0.01) + // Reps
                    (workoutData.duration >= 30 ? 0.25 : 0) + // Duration bonus
                    (workoutData.sets >= 15 ? 0.1 : 0) + // Volume bonus
                    (workoutData.duration >= 45 ? 0.15 : 0) + // Endurance bonus
                    ((workoutData.totalReps || 0) >= 100 ? 0.2 : 0) + // Century bonus
                    (workoutData.exercises >= 5 ? 0.08 : 0) + // Multi-exercise bonus
                    0.1 // Review bonus
                  ).toFixed(3)} coins</span>
                </div>
              )}
              <hr className="border-yellow-500/30" />
               <div className="flex justify-between items-center font-bold text-base">
                 <span>Total Earned</span>
                 <AnimatedCoinCounter 
                   finalAmount={(
                     (0.5 + // Base completion
                     ((workoutData.totalReps || workoutData.sets * 10) * 0.01) + // Reps
                     (workoutData.duration >= 30 ? 0.25 : 0) + // Duration bonus
                     (workoutData.sets >= 15 ? 0.1 : 0) + // Volume bonus
                     (workoutData.duration >= 45 ? 0.15 : 0) + // Endurance bonus
                     ((workoutData.totalReps || 0) >= 100 ? 0.2 : 0) + // Century bonus
                     (workoutData.exercises >= 5 ? 0.08 : 0) + // Multi-exercise bonus
                     0.1) * // Review bonus
                     (workoutData.allWorkoutsCompleted ? 2 : 1) // x2 multiplier if all workouts completed
                   )}
                   duration={2500}
                   decimals={3}
                 />
               </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Motivational Message */}
      <Card className="glow-card p-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <div className="text-center space-y-3">
          <Trophy className="h-12 w-12 mx-auto text-primary" />
          <h3 className="text-xl font-bold">Outstanding Work! 💪</h3>
          <p className="text-muted-foreground">
            You're building strength, discipline, and consistency. Every rep counts toward your fitness goals!
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <span className="px-3 py-1 bg-primary/10 rounded-full text-sm">🔥 Consistency</span>
            <span className="px-3 py-1 bg-primary/10 rounded-full text-sm">💯 Dedication</span>
            <span className="px-3 py-1 bg-primary/10 rounded-full text-sm">⚡ Progress</span>
          </div>
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