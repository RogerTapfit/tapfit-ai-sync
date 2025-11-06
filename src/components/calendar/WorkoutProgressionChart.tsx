import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface ProgressionData {
  date: string;
  weight: number;
  reps: number;
  sets: number;
  volume: number;
}

interface WorkoutProgressionChartProps {
  data: ProgressionData[];
  exerciseName: string;
}

export const WorkoutProgressionChart = ({ data, exerciseName }: WorkoutProgressionChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-card/50">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No historical data available for this exercise
          </p>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    date: format(new Date(item.date), 'MMM d'),
    Weight: item.weight,
    Volume: item.volume,
    Reps: item.reps
  }));

  // Calculate trends
  const firstSession = data[0];
  const lastSession = data[data.length - 1];
  const weightChange = lastSession.weight - firstSession.weight;
  const volumeChange = lastSession.volume - firstSession.volume;
  const weightChangePercent = firstSession.weight > 0 
    ? ((weightChange / firstSession.weight) * 100).toFixed(1) 
    : 0;
  const volumeChangePercent = firstSession.volume > 0
    ? ((volumeChange / firstSession.volume) * 100).toFixed(1)
    : 0;

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className="bg-card/50">
      <CardHeader>
        <CardTitle className="text-lg">Progression - {exerciseName}</CardTitle>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-2">
            {getTrendIcon(weightChange)}
            <span className="text-sm">
              Weight: <span className="font-semibold">{weightChangePercent}%</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(volumeChange)}
            <span className="text-sm">
              Volume: <span className="font-semibold">{volumeChangePercent}%</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              className="text-xs"
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="Weight" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="Volume" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--chart-2))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
