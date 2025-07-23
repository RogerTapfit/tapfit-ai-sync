import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Download, Shield, Apple, FileText } from 'lucide-react';
import { useHealthKit } from '@/hooks/useHealthKit';
import { cn } from '@/lib/utils';

export const HealthDataExport = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);
  const { isAvailable, hasPermissions, exportHealthData } = useHealthKit();

  const handleExport = async () => {
    if (!startDate || !endDate) return;

    setIsExporting(true);
    try {
      const data = await exportHealthData(startDate, endDate);
      
      // Create downloadable JSON file
      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `tapfit-health-data-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isAvailable) {
    return (
      <Card className="bg-muted/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Health Data Export</CardTitle>
          </div>
          <CardDescription>
            HealthKit export is only available on iOS devices
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Apple className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Health Data Export</CardTitle>
          </div>
          {hasPermissions && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <Shield className="h-3 w-3 mr-1" />
              Authorized
            </Badge>
          )}
        </div>
        <CardDescription>
          Export your health data from Apple Watch for personal use or sharing with healthcare providers
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Privacy Notice */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Privacy Protected
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your health data stays on your device. Export is completely under your control and data is never sent to external servers.
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Select Date Range</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Data Included in Export</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>Heart Rate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Blood Oxygen</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Blood Pressure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span>VO₂ Max</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>Active Energy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500" />
              <span>Activity Rings</span>
            </div>
          </div>
        </div>

        {/* Export Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleExport}
            disabled={!startDate || !endDate || !hasPermissions || isExporting}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export Health Data'}
          </Button>

          {!hasPermissions && (
            <p className="text-sm text-muted-foreground text-center">
              Grant HealthKit permissions to enable data export
            </p>
          )}
        </div>

        {/* File Format Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>Data will be exported as JSON format compatible with most health applications</span>
        </div>
      </CardContent>
    </Card>
  );
};