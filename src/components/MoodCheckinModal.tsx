import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useBiometricMood, MoodEntry } from '@/hooks/useBiometricMood';
import { useSleepData } from '@/hooks/useSleepData';
import { Smile, Frown, Meh, Zap, Brain, Moon, Heart, Battery, AlertTriangle } from 'lucide-react';

interface MoodCheckinModalProps {
  trigger?: React.ReactNode;
  context?: MoodEntry['context'];
  onComplete?: () => void;
}

const MOOD_TAGS = [
  { label: 'Rested', emoji: '😴' },
  { label: 'Tired', emoji: '🥱' },
  { label: 'Anxious', emoji: '😰' },
  { label: 'Focused', emoji: '🎯' },
  { label: 'Sore', emoji: '💪' },
  { label: 'Energized', emoji: '⚡' },
  { label: 'Stressed', emoji: '😤' },
  { label: 'Calm', emoji: '😌' }
];

const MOOD_EMOJIS = ['😢', '😔', '😐', '🙂', '😊', '😄', '🔥'];

export function MoodCheckinModal({ trigger, context = 'general', onComplete }: MoodCheckinModalProps) {
  const [open, setOpen] = useState(false);
  const [moodScore, setMoodScore] = useState(5);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [stressLevel, setStressLevel] = useState(5);
  const [motivationLevel, setMotivationLevel] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const { logMood, todaysMood, readinessScore } = useBiometricMood();
  const { lastNightSleep } = useSleepData();

  // Pre-fill with today's mood if exists
  useEffect(() => {
    if (todaysMood && open) {
      setMoodScore(todaysMood.moodScore);
      setEnergyLevel(todaysMood.energyLevel);
      setStressLevel(todaysMood.stressLevel);
      setMotivationLevel(todaysMood.motivationLevel);
      setSelectedTags(todaysMood.moodTags);
      setNotes(todaysMood.notes || '');
    }
  }, [todaysMood, open]);

  const getMoodEmoji = (score: number) => {
    const index = Math.min(Math.floor((score - 1) / 1.5), MOOD_EMOJIS.length - 1);
    return MOOD_EMOJIS[index];
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await logMood({
      moodScore,
      energyLevel,
      stressLevel,
      motivationLevel,
      moodTags: selectedTags,
      notes: notes || undefined,
      context,
      sleepHoursLastNight: lastNightSleep?.duration_minutes 
        ? lastNightSleep.duration_minutes / 60 
        : undefined,
      sleepQualityLastNight: lastNightSleep?.quality_score || undefined
    });

    setSaving(false);
    if (success) {
      setOpen(false);
      onComplete?.();
    }
  };

  const contextLabels: Record<MoodEntry['context'], string> = {
    pre_workout: 'Pre-Workout Check-in',
    post_workout: 'Post-Workout Check-in',
    morning: 'Morning Check-in',
    evening: 'Evening Check-in',
    general: 'Mood Check-in'
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Smile className="h-4 w-4" />
            Log Mood
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {contextLabels[context]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mood Score with Emoji */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Smile className="h-4 w-4 text-yellow-500" />
                Mood
              </label>
              <span className="text-3xl">{getMoodEmoji(moodScore)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Frown className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[moodScore]}
                onValueChange={([v]) => setMoodScore(v)}
                min={1}
                max={10}
                step={1}
                className="flex-1"
              />
              <Smile className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-center text-sm text-muted-foreground">{moodScore}/10</p>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Battery className="h-4 w-4 text-green-500" />
                Energy
              </label>
              <span className="text-sm font-medium">{energyLevel}/10</span>
            </div>
            <Slider
              value={[energyLevel]}
              onValueChange={([v]) => setEnergyLevel(v)}
              min={1}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-green-500"
            />
          </div>

          {/* Stress Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Stress
              </label>
              <span className="text-sm font-medium">{stressLevel}/10</span>
            </div>
            <Slider
              value={[stressLevel]}
              onValueChange={([v]) => setStressLevel(v)}
              min={1}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-red-500"
            />
          </div>

          {/* Motivation Level */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                Motivation
              </label>
              <span className="text-sm font-medium">{motivationLevel}/10</span>
            </div>
            <Slider
              value={[motivationLevel]}
              onValueChange={([v]) => setMotivationLevel(v)}
              min={1}
              max={10}
              step={1}
              className="[&_[role=slider]]:bg-purple-500"
            />
          </div>

          {/* Sleep Snapshot */}
          {lastNightSleep && (
            <Card className="p-3 bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                <Moon className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Last Night:</span>
                <span className="font-medium">
                  {(lastNightSleep.duration_minutes / 60).toFixed(1)}h
                </span>
                {lastNightSleep.quality_score && (
                  <span className="text-muted-foreground">
                    ({lastNightSleep.quality_score}/5 quality)
                  </span>
                )}
              </div>
            </Card>
          )}

          {/* Mood Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">How are you feeling?</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAGS.map(tag => (
                <Badge
                  key={tag.label}
                  variant={selectedTags.includes(tag.label) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => toggleTag(tag.label)}
                >
                  {tag.emoji} {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (optional)</label>
            <Textarea
              placeholder="How are you feeling today?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Readiness Preview */}
          {readinessScore && (
            <Card className="p-3 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Today's Readiness</span>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${
                    readinessScore.total >= 70 ? 'text-green-500' :
                    readinessScore.total >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {readinessScore.total}%
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    readinessScore.status === 'optimal' ? 'bg-green-500/20 text-green-500' :
                    readinessScore.status === 'moderate' ? 'bg-yellow-500/20 text-yellow-500' : 
                    'bg-red-500/20 text-red-500'
                  }`}>
                    {readinessScore.status}
                  </span>
                </div>
              </div>
            </Card>
          )}

          <Button 
            onClick={handleSave} 
            className="w-full" 
            disabled={saving}
          >
            {saving ? 'Saving...' : todaysMood ? 'Update Mood' : 'Save Mood'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
