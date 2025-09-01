import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Bluetooth, 
  Nfc, 
  TestTube,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { useEnhancedNFCBLE } from '@/hooks/useEnhancedNFCBLE';
import type { MachineId } from '@/services/nfcService';

const TEST_MACHINES: { id: MachineId; name: string }[] = [
  { id: 'chest-press', name: 'Chest Press' },
  { id: 'lat-pulldown', name: 'Lat Pulldown' },
  { id: 'leg-press', name: 'Leg Press' },
  { id: 'shoulder-press', name: 'Shoulder Press' }
];

interface TestResult {
  type: 'nfc' | 'ble' | 'full';
  success: boolean;
  message: string;
  timestamp: Date;
}

export const NFCBLETestPanel: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    connectionStatus,
    nfcSupported,
    connectWithNFC,
    testNFCDetection,
    testBLEOnly,
    disconnect
  } = useEnhancedNFCBLE();

  const [selectedMachine, setSelectedMachine] = useState<MachineId>('chest-press');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
  };

  const handleNFCTest = async () => {
    setActiveTest('nfc');
    try {
      const success = await testNFCDetection(selectedMachine);
      addTestResult({
        type: 'nfc',
        success,
        message: success ? `NFC detection for ${selectedMachine} successful` : 'NFC detection failed',
        timestamp: new Date()
      });
    } finally {
      setActiveTest(null);
    }
  };

  const handleBLETest = async () => {
    setActiveTest('ble');
    try {
      const success = await testBLEOnly();
      addTestResult({
        type: 'ble',
        success,
        message: success ? 'BLE scan successful' : 'BLE scan failed',
        timestamp: new Date()
      });
    } finally {
      setActiveTest(null);
    }
  };

  const handleFullTest = async () => {
    setActiveTest('full');
    try {
      const success = await connectWithNFC(selectedMachine);
      addTestResult({
        type: 'full',
        success,
        message: success ? `Full NFC→BLE connection to ${selectedMachine} successful` : 'Full connection test failed',
        timestamp: new Date()
      });
    } finally {
      setActiveTest(null);
    }
  };

  const getTestIcon = (type: TestResult['type']) => {
    switch (type) {
      case 'nfc': return <Nfc className="w-4 h-4" />;
      case 'ble': return <Bluetooth className="w-4 h-4" />;
      case 'full': return <TestTube className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          NFC + BLE Connection Tests
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Machine Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Test Machine</label>
          <Select value={selectedMachine} onValueChange={(value: MachineId) => setSelectedMachine(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEST_MACHINES.map(machine => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Connection Status:</span>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                Connected
              </Badge>
            ) : isConnecting ? (
              <Badge variant="secondary">Connecting</Badge>
            ) : (
              <Badge variant="outline">Disconnected</Badge>
            )}
            {!nfcSupported && (
              <Badge variant="destructive" className="text-xs">
                NFC Unsupported
              </Badge>
            )}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="grid grid-cols-1 gap-3">
          <Button 
            onClick={handleNFCTest}
            disabled={activeTest !== null || !nfcSupported}
            variant="outline"
            size="sm"
          >
            {activeTest === 'nfc' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Nfc className="w-4 h-4 mr-2" />
            )}
            Test NFC Detection Only
          </Button>

          <Button 
            onClick={handleBLETest}
            disabled={activeTest !== null}
            variant="outline"
            size="sm"
          >
            {activeTest === 'ble' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Bluetooth className="w-4 h-4 mr-2" />
            )}
            Test BLE Scan Only
          </Button>

          <Button 
            onClick={handleFullTest}
            disabled={activeTest !== null || isConnected}
            className="bg-primary hover:bg-primary/90"
            size="sm"
          >
            {activeTest === 'full' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Full NFC→BLE Test
          </Button>

          {isConnected && (
            <Button 
              onClick={disconnect}
              variant="destructive"
              size="sm"
            >
              Disconnect
            </Button>
          )}
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Test Results</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    {getTestIcon(result.type)}
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="flex-1">{result.message}</span>
                    <span className="text-xs text-muted-foreground">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};