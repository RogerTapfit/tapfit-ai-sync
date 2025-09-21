import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Key, Check, X } from 'lucide-react';
import { EnhancedBarcodeService } from '../services/enhancedBarcodeService';
import { toast } from 'sonner';

interface ApiKeyManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ApiKeyManager = ({ isOpen, onClose }: ApiKeyManagerProps) => {
  const [apiKeys, setApiKeys] = useState({
    goUPC: '',
    barcodeSpider: '',
    upcItemDB: 'Free API'
  });
  
  const [keyStatus, setKeyStatus] = useState(EnhancedBarcodeService.getApiKeyStatus());

  const handleSaveKey = (service: keyof typeof apiKeys) => {
    if (service === 'upcItemDB') return; // Free API, no key needed
    
    if (apiKeys[service].trim()) {
      EnhancedBarcodeService.setApiKey(service, apiKeys[service].trim());
      setKeyStatus(EnhancedBarcodeService.getApiKeyStatus());
      toast.success(`${service} API key saved successfully`);
    }
  };

  const getServiceName = (key: string) => {
    switch (key) {
      case 'goUPC': return 'Go-UPC';
      case 'barcodeSpider': return 'Barcode Spider';
      case 'upcItemDB': return 'UPCItemDB';
      case 'openFoodFacts': return 'OpenFoodFacts';
      default: return key;
    }
  };

  const getServiceDescription = (key: string) => {
    switch (key) {
      case 'goUPC': return 'Comprehensive product database with store pricing';
      case 'barcodeSpider': return 'Large product catalog with detailed information';
      case 'upcItemDB': return 'Free product lookup service (limited requests)';
      case 'openFoodFacts': return 'Free food product database with nutrition info';
      case 'alcoholDatabase': return 'Alcohol & beverage database (LCBO Canada)';
      case 'fdaDatabase': return 'FDA food database for US products';
      default: return 'Product information service';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            API Key Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure API keys for enhanced barcode scanning across multiple databases
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {Object.entries(keyStatus).map(([service, isActive]) => (
            <div key={service} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium flex items-center gap-2">
                    {getServiceName(service)}
                    <Badge variant={isActive ? "default" : "secondary"}>
                      {isActive ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {getServiceDescription(service)}
                  </p>
                </div>
              </div>
              
              {service !== 'upcItemDB' && service !== 'openFoodFacts' && service !== 'alcoholDatabase' && service !== 'fdaDatabase' && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label htmlFor={`${service}-key`} className="sr-only">
                      {getServiceName(service)} API Key
                    </Label>
                    <Input
                      id={`${service}-key`}
                      type="password"
                      placeholder={`Enter ${getServiceName(service)} API key`}
                      value={apiKeys[service as keyof typeof apiKeys]}
                      onChange={(e) => setApiKeys(prev => ({
                        ...prev,
                        [service]: e.target.value
                      }))}
                    />
                  </div>
                  <Button
                    onClick={() => handleSaveKey(service as keyof typeof apiKeys)}
                    disabled={!apiKeys[service as keyof typeof apiKeys]?.trim()}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2">API Priority Order</h4>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Go-UPC (Comprehensive with pricing)</li>
              <li>2. Barcode Spider (Large catalog)</li>
              <li>3. UPCItemDB (Free general products)</li>
              <li>4. OpenFoodFacts (Free food database)</li>
              <li>5. Alcohol Database (LCBO Canada)</li>
              <li>6. FDA Database (US food products)</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              Covers food, beverages, alcohol, supplements, and all consumables
            </p>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};