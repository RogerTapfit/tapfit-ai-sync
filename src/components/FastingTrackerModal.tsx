import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Timer, Play, Square, Clock, Flame, Zap, Info, History, BookOpen, AlertTriangle, Trophy, ChevronRight } from 'lucide-react';
import { useFastingTracking } from '@/hooks/useFastingTracking';
import { FASTING_PROTOCOLS, FASTING_MILESTONES, getDifficultyColor, getProtocolById } from '@/data/fastingProtocols';
import { FASTING_BENEFITS, AUTOPHAGY_INFO, SAFETY_WARNINGS, PROTOCOL_EDUCATION } from '@/data/fastingEducation';
import { useAuth } from '@/components/AuthGuard';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface FastingTrackerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FastingTrackerModal = ({ open, onOpenChange }: FastingTrackerModalProps) => {
  const { isGuest } = useAuth();
  const { 
    activeFast, 
    pastFasts, 
    isLoading, 
    startFast, 
    endFast, 
    cancelFast, 
    getProgress, 
    weeklyStats 
  } = useFastingTracking();
  
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [customHours, setCustomHours] = useState<number>(16);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [tick, setTick] = useState(0);

  // Update timer every second when there's an active fast
  useEffect(() => {
    if (!activeFast) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  const progress = getProgress;

  const handleStartFast = async () => {
    if (!selectedProtocol) return;
    const hours = selectedProtocol === 'custom' ? customHours : undefined;
    const success = await startFast(selectedProtocol, hours);
    if (success) {
      setSelectedProtocol(null);
    }
  };

  const handleEndFast = async (broken: boolean = false) => {
    await endFast(broken);
    setShowEndConfirm(false);
  };

  if (isGuest) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="size-5 text-amber-500" />
              Fasting Tracker
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 space-y-4">
            <Timer className="size-16 mx-auto text-amber-500/50" />
            <p className="text-muted-foreground">Sign in to track your fasting journey and unlock health benefits!</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Timer className="size-5 text-amber-500" />
            Fasting Tracker
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={activeFast ? 'active' : 'start'} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="start" disabled={!!activeFast}>Start</TabsTrigger>
            <TabsTrigger value="active" disabled={!activeFast}>Active</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="learn">Learn</TabsTrigger>
          </TabsList>

          {/* START TAB */}
          <TabsContent value="start">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Weekly Stats */}
                <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
                  <h4 className="font-medium text-amber-400 mb-2">This Week</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{weeklyStats.completedCount}</p>
                      <p className="text-xs text-muted-foreground">Fasts</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{weeklyStats.totalHours}h</p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{weeklyStats.avgHours}h</p>
                      <p className="text-xs text-muted-foreground">Avg</p>
                    </div>
                  </div>
                </div>

                {/* Protocol Selection */}
                <h4 className="font-medium">Choose a Protocol</h4>
                <div className="grid grid-cols-2 gap-3">
                  {FASTING_PROTOCOLS.filter(p => p.id !== 'custom').map((protocol) => (
                    <button
                      key={protocol.id}
                      onClick={() => setSelectedProtocol(protocol.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedProtocol === protocol.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-border hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{protocol.icon}</span>
                        <span className="font-medium text-sm">{protocol.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{protocol.fastHours}h fast</p>
                      <Badge variant="outline" className={`text-xs mt-1 ${getDifficultyColor(protocol.difficulty)}`}>
                        {protocol.difficulty}
                      </Badge>
                    </button>
                  ))}
                </div>

                {/* Custom Duration */}
                <button
                  onClick={() => setSelectedProtocol('custom')}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedProtocol === 'custom'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-border hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚙️</span>
                      <span className="font-medium">Custom Duration</span>
                    </div>
                    {selectedProtocol === 'custom' && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={customHours}
                          onChange={(e) => setCustomHours(parseInt(e.target.value) || 16)}
                          className="w-20 h-8"
                          min={1}
                          max={168}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-sm">hours</span>
                      </div>
                    )}
                  </div>
                </button>

                {selectedProtocol && (
                  <Button 
                    onClick={handleStartFast} 
                    className="w-full bg-amber-500 hover:bg-amber-600"
                    size="lg"
                  >
                    <Play className="size-4 mr-2" />
                    Start {selectedProtocol === 'custom' ? `${customHours}h` : getProtocolById(selectedProtocol)?.fastHours + 'h'} Fast
                  </Button>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* ACTIVE TAB */}
          <TabsContent value="active">
            {activeFast && progress && (
              <div className="space-y-6">
                {/* Timer Display */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-amber-400 mb-2">
                    {progress.elapsedHours}:{progress.elapsedMinutes.toString().padStart(2, '0')}
                  </div>
                  <p className="text-muted-foreground">
                    {progress.remainingHours > 0 || progress.remainingMinutes > 0 
                      ? `${progress.remainingHours}h ${progress.remainingMinutes}m remaining`
                      : '🎉 Target reached!'
                    }
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress value={progress.percentComplete} className="h-3" />
                  <p className="text-center text-sm text-muted-foreground">
                    {Math.round(progress.percentComplete)}% complete
                  </p>
                </div>

                {/* Current Milestone */}
                <AnimatePresence mode="wait">
                  {progress.currentMilestone && (
                    <motion.div
                      key={progress.currentMilestone.hours}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg p-4 border border-amber-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{progress.currentMilestone.icon}</span>
                        <div>
                          <h4 className={`font-bold ${progress.currentMilestone.color}`}>
                            {progress.currentMilestone.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {progress.currentMilestone.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Next Milestone */}
                {progress.nextMilestone && (
                  <div className="bg-muted/30 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl opacity-50">{progress.nextMilestone.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Next: {progress.nextMilestone.name}</p>
                        <p className="text-xs text-muted-foreground">at {progress.nextMilestone.hours}h</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                )}

                {/* Milestones Reached */}
                {progress.allMilestonesReached.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {progress.allMilestonesReached.map((m) => (
                      <Badge key={m.hours} variant="secondary" className="text-xs">
                        {m.icon} {m.hours}h
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowEndConfirm(true)}
                    className="flex-1"
                  >
                    <Square className="size-4 mr-2" />
                    End Fast
                  </Button>
                  {progress.percentComplete >= 100 && (
                    <Button
                      onClick={() => handleEndFast(false)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Trophy className="size-4 mr-2" />
                      Complete!
                    </Button>
                  )}
                </div>

                {/* End Confirmation */}
                {showEndConfirm && (
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <p className="text-sm">
                      {progress.percentComplete >= 100 
                        ? 'Great job! Ready to complete your fast?'
                        : 'End fast early? You\'ll still earn coins for time fasted.'
                      }
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowEndConfirm(false)}
                      >
                        Keep Going
                      </Button>
                      <Button
                        size="sm"
                        variant={progress.percentComplete >= 100 ? 'default' : 'destructive'}
                        onClick={() => handleEndFast(progress.percentComplete < 100)}
                      >
                        {progress.percentComplete >= 100 ? 'Complete' : 'End Early'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history">
            <ScrollArea className="h-[400px] pr-4">
              {pastFasts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="size-12 mx-auto mb-2 opacity-50" />
                  <p>No fasting history yet</p>
                  <p className="text-sm">Start your first fast to track progress</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pastFasts.map((fast) => (
                    <div
                      key={fast.id}
                      className="p-3 rounded-lg border border-border bg-muted/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getProtocolById(fast.fast_type)?.icon || '⏱️'}</span>
                          <span className="font-medium">{fast.fast_type}</span>
                        </div>
                        <Badge 
                          variant={fast.status === 'completed' ? 'default' : 'secondary'}
                          className={fast.status === 'completed' ? 'bg-green-600' : ''}
                        >
                          {fast.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{format(new Date(fast.started_at), 'MMM d, h:mm a')}</span>
                        <span>{fast.actual_hours?.toFixed(1) || 0}h / {fast.target_hours}h</span>
                      </div>
                      {fast.coins_earned > 0 && (
                        <p className="text-xs text-amber-400 mt-1">+{fast.coins_earned} coins</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* LEARN TAB */}
          <TabsContent value="learn">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-6">
                {/* Benefits */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Flame className="size-4 text-orange-400" />
                    Health Benefits
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {FASTING_BENEFITS.map((benefit) => (
                      <div key={benefit.title} className="p-2 rounded bg-muted/30 text-sm">
                        <span className="mr-1">{benefit.icon}</span>
                        <span className="font-medium">{benefit.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Autophagy Timeline */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Zap className="size-4 text-purple-400" />
                    {AUTOPHAGY_INFO.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">{AUTOPHAGY_INFO.description}</p>
                  <div className="space-y-2">
                    {FASTING_MILESTONES.slice(0, 6).map((milestone) => (
                      <div key={milestone.hours} className="flex items-center gap-3 p-2 rounded bg-muted/20">
                        <span className="text-lg">{milestone.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${milestone.color}`}>{milestone.hours}h - {milestone.name}</p>
                          <p className="text-xs text-muted-foreground">{milestone.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2 text-red-400">
                    <AlertTriangle className="size-4" />
                    {SAFETY_WARNINGS.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">Do not fast if you are:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {SAFETY_WARNINGS.shouldNotFast.slice(0, 4).map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
