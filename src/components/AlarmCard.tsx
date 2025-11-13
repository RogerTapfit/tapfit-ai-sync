import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Zap } from 'lucide-react';
import { type FitnessAlarm } from '@/hooks/useFitnessAlarm';

interface AlarmCardProps {
  alarm: FitnessAlarm;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTest?: (id: string) => void;
  isTesting?: boolean;
}

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const AlarmCard = ({ alarm, onToggle, onEdit, onDelete, onTest, isTesting }: AlarmCardProps) => {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Card className={`p-6 transition-all overflow-hidden ${alarm.enabled ? 'bg-card' : 'bg-muted opacity-60'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="text-4xl font-bold text-foreground whitespace-nowrap">
              {formatTime(alarm.alarm_time)}
            </h3>
            <Switch
              checked={alarm.enabled}
              onCheckedChange={(enabled) => onToggle(alarm.id, enabled)}
            />
          </div>
          
          {alarm.label && (
            <p className="text-sm text-muted-foreground mt-2 truncate">{alarm.label}</p>
          )}
          
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {DAYS_SHORT.map((day, index) => (
              <div
                key={index}
                className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-medium ${
                  (alarm.days_of_week as number[]).includes(index)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {day}
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground mt-3 break-words">
            💪 {alarm.push_up_count} push-ups required
          </p>
        </div>
        
        <div className="flex flex-col gap-2 ml-2 flex-shrink-0">
          {onTest && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTest(alarm.id)}
              disabled={isTesting}
              className="border-amber-500 text-amber-500 hover:bg-amber-500/10 disabled:opacity-50"
            >
              <Zap className="h-4 w-4 mr-1" />
              {isTesting ? '5s...' : 'Test'}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(alarm.id)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(alarm.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
