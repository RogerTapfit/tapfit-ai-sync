import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Download, Info, Upload, Zap, Wifi } from 'lucide-react';
import { FirmwareManager, type FirmwareInfo } from '@/lib/firmwareRegistry';
import { useToast } from '@/hooks/use-toast';

interface FirmwareVersionSelectorProps {
  currentDeviceFirmware?: string;
  onFirmwareSelect?: (firmware: FirmwareInfo) => void;
  showUploadButton?: boolean;
}

export function FirmwareVersionSelector({ 
  currentDeviceFirmware, 
  onFirmwareSelect,
  showUploadButton = true 
}: FirmwareVersionSelectorProps) {
  const [selectedFirmware, setSelectedFirmware] = useState<FirmwareInfo>(
    FirmwareManager.getCurrentFirmware()
  );
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const allFirmware = FirmwareManager.getAllFirmware();
  const currentAppFirmware = FirmwareManager.getCurrentFirmware();
  const isCurrentLatest = FirmwareManager.isLatestFirmware(currentDeviceFirmware || '');

  const handleFirmwareChange = (version: string) => {
    const firmware = FirmwareManager.getFirmwareByVersion(version);
    if (firmware) {
      setSelectedFirmware(firmware);
      onFirmwareSelect?.(firmware);
    }
  };

  const handleUploadFirmware = async () => {
    setIsUploading(true);
    try {
      // This would integrate with actual firmware upload functionality
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate upload
      
      toast({
        title: "Firmware uploaded",
        description: `Successfully uploaded ${selectedFirmware.title}`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload firmware to device",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getCompatibilityColor = (compatibility: string) => {
    switch (compatibility) {
      case 'stable': return 'default';
      case 'beta': return 'secondary';
      case 'experimental': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Firmware Version Manager
        </CardTitle>
        <CardDescription>
          Select and manage Puck.js firmware versions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">Device Firmware:</span>
            <Badge variant={isCurrentLatest ? 'default' : 'outline'}>
              {currentDeviceFirmware || 'Unknown'}
            </Badge>
          </div>
          {isCurrentLatest && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Latest</span>
            </div>
          )}
        </div>

        {/* App Recommended Version */}
        <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">App Recommended:</span>
            <Badge variant="default">
              {currentAppFirmware.version}
            </Badge>
          </div>
          <Badge variant="secondary" className="text-xs">
            For App v{currentAppFirmware.appVersion}
          </Badge>
        </div>

        {/* Firmware Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Firmware Version:</label>
          <Select value={selectedFirmware.version} onValueChange={handleFirmwareChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select firmware version" />
            </SelectTrigger>
            <SelectContent>
              {allFirmware.map((firmware) => (
                <SelectItem key={firmware.version} value={firmware.version}>
                  <div className="flex items-center gap-2">
                    <span>{firmware.title}</span>
                    {firmware.isRecommended && (
                      <Badge variant="default" className="text-xs">Recommended</Badge>
                    )}
                    <Badge variant={getCompatibilityColor(firmware.compatibility)} className="text-xs">
                      {firmware.compatibility}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Firmware Details */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{selectedFirmware.title}</h4>
              <Badge variant={getCompatibilityColor(selectedFirmware.compatibility)}>
                {selectedFirmware.compatibility}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{selectedFirmware.description}</p>
            
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Features:</h5>
              <div className="grid grid-cols-2 gap-1">
                {selectedFirmware.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>App Version: {selectedFirmware.appVersion}</span>
              <span>Build: {selectedFirmware.buildNumber}</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {showUploadButton && (
            <Button 
              onClick={handleUploadFirmware}
              disabled={isUploading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload to Device'}
            </Button>
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Get Code
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Firmware Code - {selectedFirmware.title}</DialogTitle>
                <DialogDescription>
                  Copy this code and paste it into the Espruino Web IDE to upload to your Puck.js
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-96 w-full border rounded-md">
                <div className="p-4">
                  <pre className="text-xs whitespace-pre-wrap">
                    {/* This would show the actual firmware code */}
                    {`// ${selectedFirmware.title}
// Version: ${selectedFirmware.version}
// Compatible with TapFit App v${selectedFirmware.appVersion}
//
// Upload this code to your Puck.js device using Espruino Web IDE
//
// Features: ${selectedFirmware.features.join(', ')}

// [Firmware code would be loaded here from FirmwareManager.getFirmwareContent()]
// This is a placeholder - actual implementation would show real firmware code
`}
                  </pre>
                </div>
              </ScrollArea>
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(`// Firmware v${selectedFirmware.version}`);
                    toast({ title: "Code copied", description: "Firmware code copied to clipboard" });
                  }}
                >
                  Copy Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Separator />

        {/* Quick Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          <span>Firmware version updates automatically with each app release</span>
        </div>
      </CardContent>
    </Card>
  );
}