import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface SetDetail {
  set_number: number;
  reps_completed: number;
  weight_used: number;
  rest_duration_seconds: number | null;
  perceived_effort: number | null;
  completed_at: string;
}

interface SetDetailTableProps {
  sets: SetDetail[];
  totalVolume: number;
}

const getRPEColor = (rpe: number) => {
  if (rpe <= 3) return 'bg-green-500/10 text-green-500 border-green-500/20';
  if (rpe <= 6) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  if (rpe <= 8) return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
  return 'bg-red-500/10 text-red-500 border-red-500/20';
};

const formatRestTime = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
};

export const SetDetailTable = ({ sets, totalVolume }: SetDetailTableProps) => {
  return (
    <div className="mt-4 space-y-2">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16 text-center">Set</TableHead>
              <TableHead className="w-20 text-center">Reps</TableHead>
              <TableHead className="w-24 text-center">Weight</TableHead>
              <TableHead className="w-24 text-center">Volume</TableHead>
              <TableHead className="w-20 text-center">RPE</TableHead>
              <TableHead className="w-20 text-center">Rest</TableHead>
              <TableHead className="text-center">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sets.map((set) => {
              const volume = set.reps_completed * set.weight_used;
              return (
                <TableRow key={set.set_number} className="text-center">
                  <TableCell className="font-medium">{set.set_number}</TableCell>
                  <TableCell>{set.reps_completed}</TableCell>
                  <TableCell>{set.weight_used} lbs</TableCell>
                  <TableCell className="text-muted-foreground">
                    {volume.toLocaleString()} lbs
                  </TableCell>
                  <TableCell>
                    {set.perceived_effort ? (
                      <Badge variant="outline" className={`text-xs ${getRPEColor(set.perceived_effort)}`}>
                        {set.perceived_effort}/10
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {set.rest_duration_seconds ? formatRestTime(set.rest_duration_seconds) : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(set.completed_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell colSpan={3} className="text-right">Total Volume:</TableCell>
              <TableCell className="text-center">{totalVolume.toLocaleString()} lbs</TableCell>
              <TableCell colSpan={3}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
