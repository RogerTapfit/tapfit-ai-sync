import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Sprout, Trophy, Coins, Calendar, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { useSobrietyTracking } from "@/hooks/useSobrietyTracking";
import { useAuth } from "./AuthGuard";
import { cn } from "@/lib/utils";
import { SobrietyCelebration } from "./SobrietyCelebration";

interface CelebrationData {
  currentDay: number;
  targetDays: number;
  percentComplete: number;
  coinsEarned: number;
  substanceType: string;
}
interface SobrietyTrackerModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

const DURATION_OPTIONS = [
  { value: 7, label: "1 Week", description: "A great start" },
  { value: 14, label: "2 Weeks", description: "Building momentum" },
  { value: 30, label: "1 Month", description: "Serious commitment" },
  { value: 60, label: "2 Months", description: "Major achievement" },
  { value: 90, label: "3 Months", description: "Life-changing" },
];

const SUBSTANCE_OPTIONS = [
  { value: "alcohol", label: "Alcohol" },
  { value: "smoking", label: "Smoking/Vaping" },
  { value: "cannabis", label: "Cannabis" },
  { value: "caffeine", label: "Caffeine" },
  { value: "sugar", label: "Sugar" },
  { value: "general", label: "General/Other" },
];

const FEELING_OPTIONS = [
  { value: "great", label: "Great! 🌟", color: "text-green-500" },
  { value: "good", label: "Good 😊", color: "text-emerald-400" },
  { value: "okay", label: "Okay 😐", color: "text-yellow-500" },
  { value: "struggling", label: "Struggling 😓", color: "text-orange-500" },
];

export const SobrietyTrackerModal = ({
  open: controlledOpen,
  onOpenChange,
  trigger,
}: SobrietyTrackerModalProps) => {
  const { isGuest } = useAuth();
  const {
    activeJourney,
    isLoading,
    startJourney,
    dailyCheckin,
    resetJourney,
    completeJourney,
    getProgress,
    pastJourneys,
    refetch,
  } = useSobrietyTracking();

  const [internalOpen, setInternalOpen] = useState(false);
  const [targetDays, setTargetDays] = useState(30);
  const [substanceType, setSubstanceType] = useState("general");
  const [notes, setNotes] = useState("");
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [view, setView] = useState<"main" | "setup" | "history">("main");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Refetch data when modal opens
  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  const progress = getProgress();

  const handleStartJourney = async () => {
    await startJourney(targetDays, substanceType, notes || undefined);
    setView("main");
    setNotes("");
  };

  const handleCheckin = async () => {
    const currentProgress = getProgress();
    const result = await dailyCheckin(selectedFeeling || undefined);
    setSelectedFeeling(null);
    
    // Show celebration if check-in was successful (result is the coins number)
    if (result !== null && currentProgress) {
      setCelebrationData({
        currentDay: currentProgress.currentDay,
        targetDays: currentProgress.targetDays,
        percentComplete: currentProgress.percentComplete,
        coinsEarned: result,
        substanceType: activeJourney?.substanceType || 'general',
      });
      setShowCelebration(true);
    }
  };

  const handleReset = async () => {
    await resetJourney("reset");
    setShowResetConfirm(false);
    setView("main");
  };

  const handleComplete = async () => {
    await completeJourney();
    setView("main");
  };

  const renderSetupView = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium mb-3 block">How long is your goal?</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setTargetDays(option.value)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all",
                targetDays === option.value
                  ? "border-green-500 bg-green-500/10"
                  : "border-border hover:border-green-500/50"
              )}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium mb-3 block">What are you focusing on?</Label>
        <RadioGroup value={substanceType} onValueChange={setSubstanceType} className="grid grid-cols-2 gap-2">
          {SUBSTANCE_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="cursor-pointer">{option.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div>
        <Label className="text-base font-medium mb-2 block">Personal motivation (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why is this important to you?"
          className="resize-none"
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setView("main")} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleStartJourney} className="flex-1 bg-green-600 hover:bg-green-700">
          <Sprout className="h-4 w-4 mr-2" />
          Start Journey
        </Button>
      </div>
    </div>
  );

  const renderActiveView = () => {
    if (!progress) return null;

    const isMilestoneDay = [7, 14, 30, 60, 90].includes(progress.currentDay);

    return (
      <div className="space-y-6">
        {/* Progress Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-500/20 mb-2">
            {isMilestoneDay ? (
              <Trophy className="size-8 text-yellow-500" />
            ) : (
              <Sprout className="size-8 text-green-500" />
            )}
          </div>
          <h3 className="text-3xl font-bold text-green-400">Day {progress.currentDay}</h3>
          <p className="text-muted-foreground">
            of {progress.targetDays} days • {activeJourney?.substanceType !== 'general' ? activeJourney?.substanceType : 'sobriety'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progress.percentComplete} className="h-3" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress.percentComplete}% complete</span>
            <span>{progress.daysRemaining} days left</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 rounded-lg p-3 text-center">
            <Coins className="size-5 mx-auto mb-1 text-yellow-500" />
            <div className="text-lg font-bold">{progress.totalCoinsEarned}</div>
            <div className="text-xs text-muted-foreground">Coins Earned</div>
          </div>
          {progress.nextMilestone && (
            <div className="bg-primary/5 rounded-lg p-3 text-center">
              <Sparkles className="size-5 mx-auto mb-1 text-purple-500" />
              <div className="text-lg font-bold">Day {progress.nextMilestone}</div>
              <div className="text-xs text-muted-foreground">Next Milestone</div>
            </div>
          )}
        </div>

        {/* Daily Check-in */}
        {!progress.checkedInToday ? (
          <div className="space-y-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <h4 className="font-medium text-center">How are you feeling today?</h4>
            <div className="flex flex-wrap justify-center gap-2">
              {FEELING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedFeeling(option.value)}
                  className={cn(
                    "px-3 py-2 rounded-lg border transition-all text-sm",
                    selectedFeeling === option.value
                      ? "border-green-500 bg-green-500/20"
                      : "border-border hover:border-green-500/50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button onClick={handleCheckin} className="w-full bg-green-600 hover:bg-green-700">
              Check In & Earn Coins
            </Button>
          </div>
        ) : (
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
            <Sparkles className="size-6 mx-auto mb-2 text-green-500" />
            <p className="text-green-400 font-medium">You've checked in today! 🎉</p>
            <p className="text-sm text-muted-foreground">Come back tomorrow for more coins</p>
          </div>
        )}

        {/* Motivation */}
        {activeJourney?.notes && (
          <div className="p-3 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground italic">"{activeJourney.notes}"</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setView("history")} className="flex-1">
            <Calendar className="h-4 w-4 mr-1" />
            History
          </Button>
          {progress.currentDay >= progress.targetDays ? (
            <Button onClick={handleComplete} className="flex-1 bg-yellow-600 hover:bg-yellow-700">
              <Trophy className="h-4 w-4 mr-1" />
              Complete Goal!
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="flex-1 text-muted-foreground hover:text-red-400 hover:border-red-400"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Reset Confirmation */}
        {showResetConfirm && (
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20 space-y-3">
            <p className="text-sm text-center">
              It's okay to reset. Every day is a new opportunity. Would you like to start over?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowResetConfirm(false)} className="flex-1">
                Keep Going
              </Button>
              <Button variant="destructive" size="sm" onClick={handleReset} className="flex-1">
                Reset Journey
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHistoryView = () => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setView("main")} className="mb-2">
        ← Back
      </Button>
      
      <h4 className="font-medium">Past Journeys</h4>
      
      {pastJourneys.length === 0 ? (
        <p className="text-muted-foreground text-sm">No past journeys yet.</p>
      ) : (
        <div className="space-y-2">
          {pastJourneys.map((journey) => {
            const duration = journey.endDate 
              ? Math.ceil((journey.endDate.getTime() - journey.startDate.getTime()) / (1000 * 60 * 60 * 24))
              : 0;
            return (
              <div key={journey.id} className="p-3 bg-primary/5 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium capitalize">{journey.substanceType}</div>
                    <div className="text-sm text-muted-foreground">
                      {duration} days • Goal: {journey.targetDays} days
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs px-2 py-1 rounded",
                    journey.reasonEnded === 'completed' 
                      ? "bg-green-500/20 text-green-400"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {journey.reasonEnded === 'completed' ? '✓ Completed' : 'Reset'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderMainView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
        </div>
      );
    }

    if (isGuest) {
      return (
        <div className="text-center py-6 space-y-3">
          <Sprout className="size-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Log in to track your sobriety journey</p>
        </div>
      );
    }

    if (activeJourney) {
      return renderActiveView();
    }

    return (
      <div className="text-center py-6 space-y-4">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-green-500/20 mb-2">
          <Sprout className="size-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold">Start Your Sobriety Journey</h3>
        <p className="text-muted-foreground text-sm">
          Set a goal, track your progress, and earn Tap Coins daily for staying on track.
        </p>
        <Button onClick={() => setView("setup")} className="bg-green-600 hover:bg-green-700">
          Get Started
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        
        {pastJourneys.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setView("history")}>
            View Past Journeys
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {controlledOpen === undefined && (
          <DialogTrigger asChild>
            {trigger || (
              <Button variant="outline" className="gap-2">
                <Sprout className="h-4 w-4" />
                Sobriety
              </Button>
            )}
          </DialogTrigger>
        )}
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sprout className="h-5 w-5 text-green-500" />
              Sobriety Tracker
            </DialogTitle>
          </DialogHeader>

          {view === "setup" && renderSetupView()}
          {view === "history" && renderHistoryView()}
          {view === "main" && renderMainView()}
        </DialogContent>
      </Dialog>

      {/* Celebration Overlay */}
      {showCelebration && celebrationData && (
        <SobrietyCelebration
          currentDay={celebrationData.currentDay}
          targetDays={celebrationData.targetDays}
          percentComplete={celebrationData.percentComplete}
          coinsEarned={celebrationData.coinsEarned}
          substanceType={celebrationData.substanceType}
          onComplete={() => setShowCelebration(false)}
        />
      )}
    </>
  );
};
