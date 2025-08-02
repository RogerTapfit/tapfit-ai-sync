import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Smartphone, ExternalLink } from 'lucide-react';
import { nfcService, MachineId, MACHINE_IDS } from '@/services/nfcService';
import { useToast } from '@/hooks/use-toast';

interface NFCMachinePopupProps {
  machineId: string;
  machineName: string;
  children: React.ReactNode;
}

// Map workout machine IDs to NFC machine IDs
const WORKOUT_TO_NFC_MAPPING: Record<string, MachineId | null> = {
  "1": "chest-press",      // Chest Press Machine
  "9": "lat-pulldown",     // Lat Pulldown Machine  
  "17": "leg-press",       // Leg Press Machine
  "12": "shoulder-press",  // Shoulder Press Machine
  "14": null,              // Bicep Curl Machine - no NFC support yet
  "15": null,              // Tricep Dip Machine - no NFC support yet
  "16": null,              // Preacher Curl Machine - no NFC support yet
  // Add more mappings as NFC support is added
};

export const NFCMachinePopup = ({ machineId, machineName, children }: NFCMachinePopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  
  const nfcMachineId = WORKOUT_TO_NFC_MAPPING[machineId];
  
  // Don't render if no NFC support for this machine
  if (!nfcMachineId) {
    return null;
  }

  const machineDetails = MACHINE_IDS[nfcMachineId];
  const nativeUrl = `tapfit://machine/${nfcMachineId}`;
  const webUrl = `https://4e37f3a9-8b52-4436-9842-e2cc950a194e.lovableproject.com/machine/${nfcMachineId}?forceHideBadge=true`;

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const openInBrowser = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            NFC Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <h4 className="font-semibold text-sm mb-1">{machineName}</h4>
            <p className="text-xs text-muted-foreground">
              Machine ID: <code className="bg-muted px-1 rounded">{nfcMachineId}</code>
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Native App URL:</span>
                <Badge variant="outline" className="text-xs">iOS/Android</Badge>
              </div>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                  {nativeUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(nativeUrl, "Native URL")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Web Fallback URL:</span>
                <Badge variant="outline" className="text-xs">Browser</Badge>
              </div>
              <div className="flex gap-2">
                <code className="flex-1 bg-muted p-2 rounded text-xs break-all">
                  {webUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(webUrl, "Web URL")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openInBrowser(webUrl)}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h5 className="text-sm font-medium mb-1">Machine Details:</h5>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>Muscle Group: {machineDetails.muscleGroup}</div>
              <div>Default Sets: {machineDetails.defaultSets}</div>
              <div>Default Reps: {machineDetails.defaultReps}</div>
              <div>Rest Time: {machineDetails.restSeconds}s</div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <h5 className="text-sm font-medium mb-1">📱 iPhone NFC Instructions:</h5>
            <p className="text-xs text-muted-foreground">
              Use the "NFC Tools" app to write these URLs to NFC tags. The native URL will open the app directly, while the web URL provides browser fallback.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};