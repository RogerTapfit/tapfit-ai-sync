import { Toggle } from '@/components/ui/toggle';

interface AlarmDaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

const DAYS = [
  { value: 0, label: 'S', full: 'Sunday' },
  { value: 1, label: 'M', full: 'Monday' },
  { value: 2, label: 'T', full: 'Tuesday' },
  { value: 3, label: 'W', full: 'Wednesday' },
  { value: 4, label: 'T', full: 'Thursday' },
  { value: 5, label: 'F', full: 'Friday' },
  { value: 6, label: 'S', full: 'Saturday' },
];

export const AlarmDaySelector = ({ selectedDays, onChange }: AlarmDaySelectorProps) => {
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day].sort());
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">Repeat On</label>
      <div className="flex gap-2 justify-between">
        {DAYS.map((day) => (
          <Toggle
            key={day.value}
            pressed={selectedDays.includes(day.value)}
            onPressedChange={() => toggleDay(day.value)}
            className="w-12 h-12 rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            aria-label={day.full}
          >
            {day.label}
          </Toggle>
        ))}
      </div>
    </div>
  );
};
