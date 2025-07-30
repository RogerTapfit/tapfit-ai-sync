import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Smartphone, Zap } from 'lucide-react';
import { nfcService, MachineId, MACHINE_IDS } from '../services/nfcService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const NFCTestPanel: React.FC = () => {
  const navigate = useNavigate();

  const handleTestMachine = (machineId: MachineId) => {
    toast.success(`Testing NFC for ${MACHINE_IDS[machineId].machine}`);
    nfcService.simulateNFCTap(machineId, (data) => {
      console.log('NFC simulation triggered:', data);
      navigate(`/machine/${data.machineId}`);
    });
  };

  const testUrls = Object.keys(MACHINE_IDS).map(machineId => ({
    machineId: machineId as MachineId,
    url: `https://4e37f3a9-8b52-4436-9842-e2cc950a194e.lovableproject.com/machine/${machineId}?forceHideBadge=true`,
    machine: MACHINE_IDS[machineId as MachineId]
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          NFC Test Panel
        </CardTitle>
        <CardDescription>
          Test NFC functionality without physical tags. These simulate the exact same flow as tapping an NFC tag.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testUrls.map(({ machineId, url, machine }) => (
            <div key={machineId} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{machine.machine}</h4>
                <Badge variant="secondary">{machine.muscleGroup}</Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded">
                {url}
              </p>
              <Button 
                size="sm" 
                onClick={() => handleTestMachine(machineId)}
                className="w-full"
              >
                <Zap className="h-3 w-3 mr-1" />
                Test {machine.machine}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>For iPhone users:</strong> After running `npx cap sync` and deploying to your iPhone, 
            you can write these URLs to NFC tags using the "NFC Tools" app, then test by tapping the tags with your TapFit app in the foreground.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};