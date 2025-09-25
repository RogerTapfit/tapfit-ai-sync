import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UploadStats {
  totalAttempts: number;
  successfulUploads: number;
  successRate: number;
}

export const PhotoStorageMonitor: React.FC = () => {
  const [stats, setStats] = useState<UploadStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUploadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('get_user_upload_success_rate', {
        _user_id: user.id,
        _days: 7
      });

      if (error) {
        console.error('Error loading upload stats:', error);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setStats({
          totalAttempts: Number(result.total_attempts),
          successfulUploads: Number(result.successful_uploads),
          successRate: Number(result.success_rate)
        });
      }
    } catch (error) {
      console.error('Failed to load upload statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUploadStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">Loading upload statistics...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalAttempts === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            No upload statistics available yet. Start logging food with photos!
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (rate: number) => {
    if (rate >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (rate >= 70) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Photo Upload Health (Last 7 days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold">{stats.totalAttempts}</div>
            <div className="text-xs text-muted-foreground">Total Attempts</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{stats.successfulUploads}</div>
            <div className="text-xs text-muted-foreground">Successful</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${getStatusColor(stats.successRate)}`}>
              {stats.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Upload Reliability:</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.successRate)}
              <span className={`text-sm ${getStatusColor(stats.successRate)}`}>
                {stats.successRate >= 90 ? 'Excellent' : stats.successRate >= 70 ? 'Good' : 'Poor'}
              </span>
            </div>
          </div>
          <Progress value={stats.successRate} className="h-2" />
        </div>

        {stats.successRate < 90 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {stats.successRate < 70 
                ? 'Photo upload reliability is poor. Contact support if issues persist.'
                : 'Some photos may not be uploading properly. Check your internet connection.'
              }
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={loadUploadStats} 
          variant="ghost" 
          size="sm"
          className="w-full text-xs"
        >
          Refresh Stats
        </Button>
      </CardContent>
    </Card>
  );
};