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

// Map workout machine IDs and names to NFC machine IDs
const WORKOUT_TO_NFC_MAPPING: Record<string, MachineId | null> = {
  // Numeric IDs (original mapping)
  "1": "chest-press",
  "2": "pec-deck",
  "3": "incline-chest-press",
  "4": "cable-crossover",
  "5": "decline-chest-press",
  "6": "smith-machine",
  "7": "seated-dip",
  "8": "assisted-chest-dips",
  "9": "lat-pulldown",
  "10": "seated-cable-row",
  "11": "t-bar-row",
  "12": "shoulder-press",
  "13": "lateral-raise",
  "14": "bicep-curl",
  "15": "tricep-dip",
  "16": "preacher-curl",
  "17": "leg-press",
  "18": "leg-extension",
  "19": "leg-curl",
  "20": "treadmill",
  "21": "rowing-machine",
  "22": "stairmaster",
  
  // Kebab-case names (for exercise.machine conversion)
  "chest-press-machine": "chest-press",
  "pec-deck-(butterfly)-machine": "pec-deck",
  "incline-chest-press-machine": "incline-chest-press",
  "cable-crossover-machine": "cable-crossover",
  "decline-chest-press-machine": "decline-chest-press",
  "smith-machine-(flat-bench-press)": "smith-machine",
  "seated-dip-machine": "seated-dip",
  "assisted-chest-dips-machine": "assisted-chest-dips",
  "lat-pulldown-machine": "lat-pulldown",
  "seated-cable-row": "seated-cable-row",
  "t-bar-row-machine": "t-bar-row",
  "shoulder-press-machine": "shoulder-press",
  "lateral-raise-machine": "lateral-raise",
  "bicep-curl-machine": "bicep-curl",
  "tricep-dip-machine": "tricep-dip",
  "preacher-curl-machine": "preacher-curl",
  "leg-press-machine": "leg-press",
  "leg-extension-machine": "leg-extension",
  "leg-curl-machine": "leg-curl",
  "treadmill": "treadmill",
  "rowing-machine": "rowing-machine",
  "stairmaster": "stairmaster"
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
  const webUrl = `https://4e37f3a9-8b52-4436-9842-e2cc950a194e.lovableproject.com/?forceHideBadge=true#/machine/${nfcMachineId}`;

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