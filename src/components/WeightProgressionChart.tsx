import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface WeightProgressionChartProps {
  exerciseName: string;
  machineName: string;
}

interface WeightProgressionData {
  id: string;
  exercise_name: string;
  machine_name: string;
  new_weight: number;
  previous_weight?: number;
  created_at: string;
}

interface ChartDataPoint {
  date: string;
  weight: number;
  trend?: number;
  forecast?: number;
  displayDate: string;
}

export const WeightProgressionChart = ({ exerciseName, machineName }: WeightProgressionChartProps) => {
  const [progressions, setProgressions] = useState<WeightProgressionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState({
    trend: 0,
    avgIncrease: 0,
    totalIncrease: 0,
    forecastWeight: 0
  });

  useEffect(() => {
    fetchProgressions();
  }, [exerciseName, machineName]);

  const fetchProgressions = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('weight_progressions')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_name', exerciseName)
        .eq('machine_name', machineName)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProgressions(data || []);
    } catch (error) {
      console.error('Error fetching progressions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!progressions.length) return;

    // Build chart data
    const data: ChartDataPoint[] = progressions.map(p => ({
      date: new Date(p.created_at).toISOString(),
      displayDate: format(new Date(p.created_at), 'MMM d'),
      weight: p.new_weight,
    }));

    // Calculate linear regression for trend line
    const n = data.length;
    if (n > 1) {
      const sumX = data.reduce((sum, _, i) => sum + i, 0);
      const sumY = data.reduce((sum, d) => sum + d.weight, 0);
      const sumXY = data.reduce((sum, d, i) => sum + (i * d.weight), 0);
      const sumX2 = data.reduce((sum, _, i) => sum + (i * i), 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Add trend line
      data.forEach((d, i) => {
        d.trend = intercept + slope * i;
      });

      // Forecast next 2 data points
      const forecastPoints: ChartDataPoint[] = [];
      for (let i = 1; i <= 2; i++) {
        const forecastIndex = n + i;
        const forecastWeight = intercept + slope * forecastIndex;
        const lastDate = new Date(data[n - 1].date);
        const avgDaysBetween = n > 1 
          ? (new Date(data[n - 1].date).getTime() - new Date(data[0].date).getTime()) / (n - 1) / (1000 * 60 * 60 * 24)
          : 7;
        
        const forecastDate = new Date(lastDate.getTime() + avgDaysBetween * i * 24 * 60 * 60 * 1000);
        
        forecastPoints.push({
          date: forecastDate.toISOString(),
          displayDate: format(forecastDate, 'MMM d'),
          forecast: Math.round(forecastWeight),
          weight: 0
        });
      }

      setChartData([...data, ...forecastPoints]);

      // Calculate statistics
      const firstWeight = data[0].weight;
      const lastWeight = data[n - 1].weight;
      const totalIncrease = lastWeight - firstWeight;
      const avgIncrease = totalIncrease / (n - 1);
      const forecastWeight = Math.round(intercept + slope * (n + 2));

      setStats({
        trend: slope,
        avgIncrease: Math.round(avgIncrease * 10) / 10,
        totalIncrease: Math.round(totalIncrease),
        forecastWeight
      });
    } else {
      setChartData(data);
      setStats({
        trend: 0,
        avgIncrease: 0,
        totalIncrease: 0,
        forecastWeight: data[0].weight
      });
    }
  }, [progressions]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse text-muted-foreground">Loading progression data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No progression data available yet. Complete workouts to track progress!
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = () => {
    if (stats.trend > 0.5) return <TrendingUp className="h-4 w-4 text-success" />;
    if (stats.trend < -0.5) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (stats.trend > 0.5) return 'text-success';
    if (stats.trend < -0.5) return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{exerciseName} - Weight Progression</span>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className={`text-sm font-normal ${getTrendColor()}`}>
              {stats.trend > 0 ? '+' : ''}{stats.avgIncrease} lbs/session
            </span>
          </div>
        </CardTitle>
        <CardDescription>{machineName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalIncrease > 0 ? '+' : ''}{stats.totalIncrease}</div>
            <div className="text-xs text-muted-foreground">Total Increase (lbs)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.avgIncrease > 0 ? '+' : ''}{stats.avgIncrease}</div>
            <div className="text-xs text-muted-foreground">Avg Per Session (lbs)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-chart-2">{stats.forecastWeight}</div>
            <div className="text-xs text-muted-foreground">Forecasted Weight (lbs)</div>
          </div>
        </div>

        <ChartContainer
          config={{
            weight: {
              label: 'Weight',
              color: 'hsl(var(--chart-1))',
            },
            trend: {
              label: 'Trend',
              color: 'hsl(var(--chart-2))',
            },
            forecast: {
              label: 'Forecast',
              color: 'hsl(var(--chart-3))',
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="displayDate" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              
              {/* Actual weight line */}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--chart-1))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--chart-1))', r: 5 }}
                activeDot={{ r: 7 }}
                name="Actual Weight"
                connectNulls={false}
              />
              
              {/* Trend line */}
              <Line
                type="monotone"
                dataKey="trend"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Trend Line"
              />
              
              {/* Forecast line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="hsl(var(--chart-3))"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ fill: 'hsl(var(--chart-3))', r: 4 }}
                name="Forecast"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          📈 Chart shows actual weight progression, trend analysis, and forecasted future progress
        </div>
      </CardContent>
    </Card>
  );
};
