import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlarmCard } from '@/components/AlarmCard';
import { useFitnessAlarm } from '@/hooks/useFitnessAlarm';
import { useAlarmScheduler } from '@/hooks/useAlarmScheduler';
import { Plus, ArrowLeft, Bell } from 'lucide-react';
import { alarmNotificationService } from '@/services/alarmNotificationService';
import { useToast } from '@/hooks/use-toast';

export default function FitnessAlarm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { alarms, isLoading, toggleAlarm, deleteAlarm } = useFitnessAlarm();
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  const [testingAlarmId, setTestingAlarmId] = useState<string | null>(null);

  const handleRequestNotificationPermission = async () => {
    const granted = await alarmNotificationService.requestPermission();
    setHasRequestedPermission(true);
    
    if (granted) {
      toast({ title: '🔔 Notifications enabled!', description: 'You\'ll receive alarm notifications.' });
    } else {
      toast({ 
        title: '⚠️ Notifications disabled', 
        description: 'Alarms will only work when the app is open.',
        variant: 'destructive'
      });
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleAlarm({ id, enabled });
    } catch (error) {
      console.error('Failed to toggle alarm:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this alarm?')) {
      try {
        await deleteAlarm(id);
      } catch (error) {
        console.error('Failed to delete alarm:', error);
      }
    }
  };

  const handleTestAlarm = (alarmId: string) => {
    setTestingAlarmId(alarmId);
    toast({
      title: '⏱️ Test alarm starting...',
      description: 'Alarm will trigger in 5 seconds!',
    });

    setTimeout(() => {
      console.log('🧪 Test alarm triggering for ID:', alarmId);
      navigate(`/alarm-ringing/${alarmId}`);
      setTestingAlarmId(null);
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Fitness Alarm</h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="text-6xl mb-4">⏰💪</div>
          <h2 className="text-3xl font-black text-foreground mb-2">
            Wake Up & Push Up
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Set alarms that require you to complete push-ups before they turn off. No more snoozing!
          </p>
        </div>

        {/* Notification Permission Banner */}
        {!alarmNotificationService.hasPermission() && !hasRequestedPermission && (
          <div className="bg-accent/50 border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Enable Notifications</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Allow notifications so your alarms can wake you up even when the app is closed.
                </p>
                <Button onClick={handleRequestNotificationPermission} size="sm">
                  Enable Notifications
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Alarms List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading alarms...
            </div>
          ) : alarms && alarms.length > 0 ? (
            alarms.map((alarm) => (
              <AlarmCard
                key={alarm.id}
                alarm={alarm}
                onToggle={handleToggle}
                onEdit={(id) => navigate(`/alarm-setup/${id}`)}
                onDelete={handleDelete}
                onTest={handleTestAlarm}
                isTesting={testingAlarmId === alarm.id}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">😴</div>
              <p className="text-muted-foreground mb-4">
                No alarms set yet. Create your first fitness alarm!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FAB - Create Alarm */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl"
        onClick={() => navigate('/alarm-setup')}
      >
        <Plus className="h-8 w-8" />
      </Button>
    </div>
  );
}
