import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Bluetooth } from 'lucide-react';
import { BluetoothDiagnostics, BluetoothDiagnosticResult } from '@/utils/bluetoothDiagnostics';

export function BluetoothDiagnosticsPanel() {
  const [results, setResults] = useState<BluetoothDiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const diagnostics = await BluetoothDiagnostics.runFullDiagnostic();
      setResults(diagnostics);
    } catch (error) {
      setResults([{
        success: false,
        message: `Diagnostic failed: ${error}`,
        details: { error }
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bluetooth className="h-5 w-5" />
          Bluetooth Diagnostics
        </CardTitle>
        <CardDescription>
          Test Bluetooth LE functionality and device connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Bluetooth Test'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{result.message}</p>
                  {result.details && (
                    <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? 'Pass' : 'Fail'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}