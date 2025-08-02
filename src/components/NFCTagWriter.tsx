import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { nfcService, MACHINE_IDS, type MachineId } from '@/services/nfcService';
import { Smartphone, Tag, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const NFCTagWriter = () => {
  const [selectedMachine, setSelectedMachine] = useState<MachineId | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [nfcAvailable, setNfcAvailable] = useState<boolean | null>(null);

  const checkNFCAvailability = async () => {
    try {
      const available = await nfcService.isNFCAvailable();
      setNfcAvailable(available);
    } catch (error) {
      console.error('Error checking NFC availability:', error);
      setNfcAvailable(false);
    }
  };

  const handleWriteTag = async () => {
    if (!selectedMachine) {
      toast.error('Please select a machine first');
      return;
    }

    setIsWriting(true);
    try {
      await nfcService.writeNFCTag(selectedMachine);
      toast.success('NFC tag written successfully! You can now tap the tag to access the machine.');
    } catch (error) {
      console.error('Error writing NFC tag:', error);
      toast.error('Failed to write NFC tag. Make sure NFC is enabled and a tag is nearby.');
    } finally {
      setIsWriting(false);
    }
  };

  const getManualInstructions = () => {
    if (!selectedMachine) return null;

    const universalUrl = `https://4e37f3a9-8b52-4436-9842-e2cc950a194e.lovableproject.com/?forceHideBadge=true#/machine/${selectedMachine}`;
    const fallbackUrl = universalUrl;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Manual NFC Programming (using NFC Tools app)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <p><strong>1.</strong> Open the NFC Tools app on your phone</p>
            <p><strong>2.</strong> Tap "Write" at the bottom</p>
            <p><strong>3.</strong> Select "Add a record"</p>
            <p><strong>4.</strong> Choose "URL/URI"</p>
            <p><strong>5.</strong> Use this universal URL that will open the app:</p>
            <div className="bg-muted p-2 rounded text-xs font-mono break-all">
              {universalUrl}
            </div>
            <p><strong>6.</strong> Tap "Write" and hold your NFC tag near your phone</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(universalUrl);
                toast.success('URL copied to clipboard!');
              }}
            >
              Copy URL
            </Button>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This URL will automatically open the TapFit app and navigate directly to the {MACHINE_IDS[selectedMachine].machine} workout. No notifications or manual navigation required!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            NFC Tag Writer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Machine</label>
            <Select value={selectedMachine || ''} onValueChange={(value) => setSelectedMachine(value as MachineId)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a machine to program..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MACHINE_IDS).map(([id, details]) => (
                  <SelectItem key={id} value={id}>
                    <div className="flex items-center gap-2">
                      <span>{details.machine}</span>
                      <Badge variant="outline" className="text-xs">
                        {details.muscleGroup}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMachine && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">{MACHINE_IDS[selectedMachine].machine}</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Muscle Group: {MACHINE_IDS[selectedMachine].muscleGroup}</p>
                <p>Default Sets: {MACHINE_IDS[selectedMachine].defaultSets}</p>
                <p>Default Reps: {MACHINE_IDS[selectedMachine].defaultReps}</p>
                <p>Rest Time: {MACHINE_IDS[selectedMachine].restSeconds}s</p>
              </div>
            </div>
          )}

          {nfcAvailable === null && (
            <Button onClick={checkNFCAvailability} variant="outline" className="w-full">
              Check NFC Availability
            </Button>
          )}

          {nfcAvailable === true && (
            <div className="space-y-2">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  NFC is available on this device
                </AlertDescription>
              </Alert>
              <Button 
                onClick={handleWriteTag} 
                disabled={!selectedMachine || isWriting}
                className="w-full"
              >
                {isWriting ? 'Writing NFC Tag...' : 'Write NFC Tag'}
              </Button>
            </div>
          )}

          {nfcAvailable === false && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                NFC is not available on this device or browser. Use the manual instructions below.
              </AlertDescription>
            </Alert>
          )}

          {getManualInstructions()}
        </CardContent>
      </Card>
    </div>
  );
};

export default NFCTagWriter;