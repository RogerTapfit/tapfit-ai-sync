import { Input } from '@/components/ui/input';

interface AlarmTimePickerProps {
  time: string;
  onChange: (time: string) => void;
}

export const AlarmTimePicker = ({ time, onChange }: AlarmTimePickerProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor="alarm-time" className="text-sm font-medium text-foreground">
        Alarm Time
      </label>
      <Input
        id="alarm-time"
        type="time"
        value={time}
        onChange={(e) => onChange(e.target.value)}
        className="text-3xl font-bold text-center h-20 bg-secondary"
      />
    </div>
  );
};
