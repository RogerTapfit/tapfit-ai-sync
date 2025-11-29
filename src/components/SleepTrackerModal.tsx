import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Moon, Star, Trash2, Watch, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSleepData } from '@/hooks/useSleepData';
import { format, subDays, parse, setHours, setMinutes } from 'date-fns';
import { Capacitor } from '@capacitor/core';

interface SleepTrackerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SleepTrackerModal = ({ open, onOpenChange }: SleepTrackerModalProps) => {
  const {
    lastNightSleep,
    weeklyLogs,
    stats,
    targetHours,
    isLoading,
    logSleep,
    importFromHealthKit,
    deleteSleep,
    calculateSleepScore,
    formatDuration
  } = useSleepData();

  const [bedtime, setBedtime] = useState('22:30');
  const [wakeTime, setWakeTime] = useState('06:30');
  const [quality, setQuality] = useState(3);
  const [awakenings, setAwakenings] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const isNative = Capacitor.isNativePlatform();

  // Calculate duration from times
  const calculateDuration = (): number => {
    const [bedH, bedM] = bedtime.split(':').map(Number);
    const [wakeH, wakeM] = wakeTime.split(':').map(Number);
    
    let bedMinutes = bedH * 60 + bedM;
    let wakeMinutes = wakeH * 60 + wakeM;
    
    // If wake time is earlier, assume next day
    if (wakeMinutes <= bedMinutes) {
      wakeMinutes += 24 * 60;
    }
    
    return wakeMinutes - bedMinutes;
  };

  const durationMinutes = calculateDuration();
  const durationHours = (durationMinutes / 60).toFixed(1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const yesterday = subDays(new Date(), 1);
    const [bedH, bedM] = bedtime.split(':').map(Number);
    const [wakeH, wakeM] = wakeTime.split(':').map(Number);
    
    let bedDate = setMinutes(setHours(yesterday, bedH), bedM);
    let wakeDate = setMinutes(setHours(new Date(), wakeH), wakeM);
    
    // Adjust dates if needed
    if (wakeDate <= bedDate) {
      wakeDate = setMinutes(setHours(subDays(new Date(), 0), wakeH), wakeM);
    }

    await logSleep({
      sleepDate: yesterday,
      bedtime: bedDate,
      wakeTime: wakeDate,
      qualityScore: quality,
      awakenings,
      notes: notes || undefined
    });

    setIsSubmitting(false);
    onOpenChange(false);
  };

  const handleImport = async () => {
    setIsImporting(true);
    await importFromHealthKit();
    setIsImporting(false);
  };

  const handleDelete = async () => {
    if (lastNightSleep) {
      await deleteSleep(lastNightSleep.sleep_date);
    }
  };

  const sleepScore = lastNightSleep ? calculateSleepScore(lastNightSleep) : 0;
  const scoreColor = sleepScore >= 80 ? 'text-green-500' : sleepScore >= 60 ? 'text-yellow-500' : 'text-red-500';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-indigo-400" />
            Sleep Tracker
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Last Night's Sleep Summary */}
          {lastNightSleep && (
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Last Night</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-red-500"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    {formatDuration(lastNightSleep.duration_minutes)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (lastNightSleep.quality_score || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className={`text-4xl font-bold ${scoreColor}`}>{sleepScore}</div>
                  <div className="text-xs text-muted-foreground">Sleep Score</div>
                </div>
              </div>
              
              {lastNightSleep.source === 'healthkit' && (
                <div className="mt-3 text-xs text-indigo-400 flex items-center gap-1">
                  <Watch className="h-3 w-3" />
                  Imported from Apple Watch
                </div>
              )}
            </div>
          )}

          {/* Quick Log Form */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-muted-foreground">Log Sleep</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedtime" className="text-xs">Bedtime</Label>
                <Input
                  id="bedtime"
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="waketime" className="text-xs">Wake Time</Label>
                <Input
                  id="waketime"
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="text-center py-2 bg-muted/50 rounded-lg">
              <span className="text-2xl font-bold text-indigo-400">{durationHours}h</span>
              <span className="text-sm text-muted-foreground ml-2">of sleep</span>
            </div>

            {/* Quality Rating */}
            <div>
              <Label className="text-xs">Sleep Quality</Label>
              <div className="flex items-center gap-2 mt-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setQuality(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= quality
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-center text-xs text-muted-foreground mt-1">
                {quality === 1 && 'Poor'}
                {quality === 2 && 'Fair'}
                {quality === 3 && 'Good'}
                {quality === 4 && 'Very Good'}
                {quality === 5 && 'Excellent'}
              </div>
            </div>

            {/* Awakenings */}
            <div>
              <Label className="text-xs">Times Woken Up</Label>
              <div className="flex items-center gap-3 mt-2 justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setAwakenings(Math.max(0, awakenings - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xl font-bold w-8 text-center">{awakenings}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setAwakenings(awakenings + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="How did you feel? Any dreams?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 h-20"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              {isSubmitting ? 'Saving...' : 'Log Sleep'}
            </Button>

            {isNative && (
              <Button
                variant="outline"
                onClick={handleImport}
                disabled={isImporting}
                className="w-full"
              >
                <Watch className="h-4 w-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import from Apple Watch'}
              </Button>
            )}
          </div>

          {/* Weekly Chart */}
          <div>
            <h3 className="font-medium text-sm text-muted-foreground mb-3">This Week</h3>
            <div className="flex items-end gap-1 h-24">
              {Array.from({ length: 7 }).map((_, i) => {
                const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
                const dayLog = weeklyLogs.find(l => l.sleep_date === date);
                const hours = dayLog?.duration_minutes ? dayLog.duration_minutes / 60 : 0;
                const heightPercent = Math.min(100, (hours / 10) * 100);
                const isTarget = hours >= targetHours;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isTarget 
                          ? 'bg-gradient-to-t from-indigo-500 to-purple-400' 
                          : hours > 0 
                            ? 'bg-indigo-500/50' 
                            : 'bg-muted'
                      }`}
                      style={{ height: `${Math.max(4, heightPercent)}%` }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {format(subDays(new Date(), 6 - i), 'EEE').charAt(0)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Goal: {targetHours}h</span>
              <span>Avg: {formatDuration(stats.avgDuration)}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-lg font-bold text-foreground">{stats.totalNights}</div>
              <div className="text-xs text-muted-foreground">Nights Logged</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-lg font-bold text-foreground">{stats.avgQuality.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground">Avg Quality</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-lg font-bold text-indigo-400">{stats.streak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
