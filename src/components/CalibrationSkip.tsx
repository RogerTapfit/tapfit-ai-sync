import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Clock, TrendingUp } from 'lucide-react';

interface CalibrationSkipProps {
  onUseSmartSetup: () => void;
  onUseManualSetup: () => void;
}

export const CalibrationSkip: React.FC<CalibrationSkipProps> = ({
  onUseSmartSetup,
  onUseManualSetup
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose Your Setup Method</CardTitle>
          <p className="text-muted-foreground">
            We've improved the calibration process to save you time
          </p>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {/* Smart Setup Option */}
        <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" onClick={onUseSmartSetup}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Smart Auto-Setup</CardTitle>
                  <p className="text-sm text-muted-foreground">Recommended</p>
                </div>
              </div>
              <Badge variant="default">New!</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              AI calculates your starting weights based on your profile and experience level. 
              Optional 2-minute validation for key exercises.
            </p>
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span>2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span>AI-powered</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span>Auto-adjusting</span>
              </div>
            </div>

            <Button className="w-full" onClick={onUseSmartSetup}>
              Use Smart Setup
            </Button>
          </CardContent>
        </Card>

        {/* Manual Setup Option */}
        <Card className="hover:border-muted-foreground/40 transition-colors cursor-pointer" onClick={onUseManualSetup}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Zap className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Manual Calibration</CardTitle>
                <p className="text-sm text-muted-foreground">Traditional method</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">
              Test your maximum weights across 6 exercises. More accurate but takes 15-20 minutes.
            </p>
            
            <Button variant="outline" className="w-full" onClick={onUseManualSetup}>
              Use Manual Setup
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm text-center text-muted-foreground">
            💡 Don't worry - both methods learn from your workouts and improve over time
          </p>
        </CardContent>
      </Card>
    </div>
  );
};