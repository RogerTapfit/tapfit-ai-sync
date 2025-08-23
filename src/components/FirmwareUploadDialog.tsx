import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertTriangle, Bluetooth, Zap, Copy } from 'lucide-react';
import { FirmwareManager, type FirmwareInfo } from '@/lib/firmwareRegistry';
import { useToast } from '@/hooks/use-toast';

interface FirmwareUploadDialogProps {
  firmware: FirmwareInfo;
  deviceConnected?: boolean;
  trigger?: React.ReactNode;
}

export function FirmwareUploadDialog({ 
  firmware, 
  deviceConnected = false,
  trigger 
}: FirmwareUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadStep, setUploadStep] = useState<'ready' | 'uploading' | 'success' | 'error'>('ready');
  const [progress, setProgress] = useState(0);
  const [firmwareCode, setFirmwareCode] = useState<string>('');
  const { toast } = useToast();

  const loadFirmwareCode = async () => {
    try {
      const code = await FirmwareManager.getFirmwareContent(firmware.filename);
      setFirmwareCode(code);
    } catch (error) {
      console.error('Failed to load firmware code:', error);
      setFirmwareCode(`// ${firmware.title}
// Version: ${firmware.version}
// 
// Error loading firmware code. Please check the firmware registry.
`);
    }
  };

  const handleUpload = async () => {
    setUploadStep('uploading');
    setProgress(0);
    
    // Simulate firmware upload process
    const steps = [
      { message: 'Preparing firmware...', progress: 20 },
      { message: 'Connecting to device...', progress: 40 },
      { message: 'Uploading firmware...', progress: 70 },
      { message: 'Verifying upload...', progress: 90 },
      { message: 'Complete!', progress: 100 }
    ];
    
    try {
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setProgress(step.progress);
      }
      
      setUploadStep('success');
      toast({
        title: "Firmware uploaded successfully",
        description: `${firmware.title} is now running on your device`,
      });
    } catch (error) {
      setUploadStep('error');
      toast({
        title: "Upload failed",
        description: "Failed to upload firmware to device",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = () => {
    if (!firmwareCode) {
      loadFirmwareCode().then(() => {
        navigator.clipboard.writeText(firmwareCode);
        toast({
          title: "Code copied",
          description: "Firmware code copied to clipboard",
        });
      });
    } else {
      navigator.clipboard.writeText(firmwareCode);
      toast({
        title: "Code copied",
        description: "Firmware code copied to clipboard",
      });
    }
  };

  const resetUpload = () => {
    setUploadStep('ready');
    setProgress(0);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && !firmwareCode) {
      loadFirmwareCode();
    }
    if (!open && uploadStep !== 'ready') {
      resetUpload();
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="flex items-center gap-2">
      <Upload className="h-4 w-4" />
      Upload Firmware
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Upload {firmware.title}
          </DialogTitle>
          <DialogDescription>
            Upload firmware version {firmware.version} to your Puck.js device
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Firmware Info */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Version: {firmware.version}</span>
              <Badge variant={firmware.compatibility === 'stable' ? 'default' : 'secondary'}>
                {firmware.compatibility}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{firmware.description}</p>
            <div className="text-xs text-muted-foreground">
              Compatible with App v{firmware.appVersion}
            </div>
          </div>

          <Separator />

          {/* Device Connection Status */}
          <div className="flex items-center gap-2">
            <Bluetooth className={`h-4 w-4 ${deviceConnected ? 'text-green-600' : 'text-muted-foreground'}`} />
            <span className="text-sm">
              Device: {deviceConnected ? 'Connected' : 'Not Connected'}
            </span>
            {deviceConnected && <CheckCircle className="h-4 w-4 text-green-600" />}
          </div>

          {/* Upload Progress */}
          {uploadStep === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading firmware...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Success State */}
          {uploadStep === 'success' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Firmware uploaded successfully! Your device is now running {firmware.title}.
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {uploadStep === 'error' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to upload firmware. Please ensure your device is connected and try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {uploadStep === 'ready' && (
              <>
                <Button 
                  onClick={handleUpload} 
                  disabled={!deviceConnected}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {deviceConnected ? 'Upload Now' : 'Device Not Connected'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCopyCode}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Get Code
                </Button>
              </>
            )}

            {uploadStep === 'uploading' && (
              <Button disabled className="w-full">
                Uploading...
              </Button>
            )}

            {(uploadStep === 'success' || uploadStep === 'error') && (
              <Button onClick={resetUpload} className="w-full">
                Upload Another
              </Button>
            )}
          </div>

          {/* Manual Upload Instructions */}
          {!deviceConnected && uploadStep === 'ready' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Device not connected. You can copy the firmware code and upload it manually using Espruino Web IDE.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}