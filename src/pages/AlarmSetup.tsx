import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlarmTimePicker } from '@/components/AlarmTimePicker';
import { AlarmDaySelector } from '@/components/AlarmDaySelector';
import { useFitnessAlarm } from '@/hooks/useFitnessAlarm';
import { useAuth } from '@/components/AuthGuard';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

export default function AlarmSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const { isGuest } = useAuth();
  const { alarms, createAlarm, updateAlarm } = useFitnessAlarm();
  
  const [time, setTime] = useState('07:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [pushUpCount, setPushUpCount] = useState(15);
  const [alarmSound, setAlarmSound] = useState('classic');
  const [label, setLabel] = useState('');

  // Redirect guests to auth page
  useEffect(() => {
    if (isGuest) {
      toast({
        title: '🔐 Authentication Required',
        description: 'Please sign up or log in to create alarms.',
        variant: 'destructive',
      });
      navigate('/auth');
    }
  }, [isGuest, navigate, toast]);

  // Load existing alarm if editing
  useEffect(() => {
    if (id && alarms) {
      const alarm = alarms.find(a => a.id === id);
      if (alarm) {
        setTime(alarm.alarm_time.slice(0, 5));
        setSelectedDays(alarm.days_of_week as number[]);
        setPushUpCount(alarm.push_up_count);
        setAlarmSound(alarm.alarm_sound);
        setLabel(alarm.label || '');
      }
    }
  }, [id, alarms]);

  const handleSave = async () => {
    const alarmData = {
      alarm_time: time + ':00',
      days_of_week: selectedDays,
      push_up_count: pushUpCount,
      alarm_sound: alarmSound,
      label: label || null,
      enabled: true,
    };

    try {
      if (id) {
        await updateAlarm({ id, updates: alarmData });
      } else {
        await createAlarm(alarmData);
      }
      navigate('/fitness-alarm');
    } catch (error) {
      console.error('Failed to save alarm:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-full">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/fitness-alarm')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              {id ? 'Edit Alarm' : 'New Alarm'}
            </h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl space-y-8 overflow-x-hidden">
        {/* Time Picker */}
        <AlarmTimePicker time={time} onChange={setTime} />

        {/* Days Selector */}
        <AlarmDaySelector selectedDays={selectedDays} onChange={setSelectedDays} />

        {/* Push-up Count Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Push-ups Required</label>
            <span className="text-2xl font-bold text-primary">{pushUpCount}</span>
          </div>
          <Slider
            value={[pushUpCount]}
            onValueChange={(value) => setPushUpCount(value[0])}
            min={5}
            max={50}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground text-center">
            Slide to adjust the number of push-ups needed to turn off the alarm
          </p>
        </div>

        {/* Alarm Sound Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Alarm Sound</label>
          <Select value={alarmSound} onValueChange={setAlarmSound}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classic">🔔 Classic Beep</SelectItem>
              <SelectItem value="siren">🚨 Loud Siren</SelectItem>
              <SelectItem value="horn">📢 Motivational Horn</SelectItem>
              <SelectItem value="gentle">🌅 Gentle Wake</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alarm Label */}
        <div className="space-y-2">
          <label htmlFor="label" className="text-sm font-medium text-foreground">
            Label (Optional)
          </label>
          <Input
            id="label"
            placeholder="e.g., Morning Workout, Wake Up Call"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Save Button */}
        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold"
          onClick={handleSave}
        >
          <Save className="h-5 w-5 mr-2" />
          {id ? 'Update Alarm' : 'Create Alarm'}
        </Button>
      </div>
    </div>
  );
}
