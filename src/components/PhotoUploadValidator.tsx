import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { FoodPhotoUploadService } from '@/services/foodPhotoUploadService';

interface PhotoUploadValidatorProps {
  onValidationComplete: (isValid: boolean) => void;
}

export const PhotoUploadValidator: React.FC<PhotoUploadValidatorProps> = ({ onValidationComplete }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    bucketAccess: boolean | null;
    uploadTest: boolean | null;
    errorMessage?: string;
  }>({
    bucketAccess: null,
    uploadTest: null
  });

  const runValidation = async () => {
    setIsValidating(true);
    setValidationResults({ bucketAccess: null, uploadTest: null });

    try {
      // Test 1: Check bucket access
      console.log('Testing bucket access...');
      const bucketAccess = await FoodPhotoUploadService.verifyBucketAccess();
      setValidationResults(prev => ({ ...prev, bucketAccess }));

      if (!bucketAccess) {
        setValidationResults(prev => ({ 
          ...prev, 
          errorMessage: 'Storage bucket is not accessible. Photos cannot be saved.' 
        }));
        onValidationComplete(false);
        return;
      }

      // Test 2: Perform a test upload
      console.log('Testing photo upload...');
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 100;
      testCanvas.height = 100;
      const ctx = testCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('TEST', 35, 55);
      }

      const testBlob = await new Promise<Blob>((resolve) => {
        testCanvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      const testFile = new File([testBlob], 'validation_test.png', { type: 'image/png' });
      const uploadResult = await FoodPhotoUploadService.uploadFoodPhoto(testFile, 'test');

      if (uploadResult.success) {
        setValidationResults(prev => ({ ...prev, uploadTest: true }));
        
        // Clean up test file
        if (uploadResult.storagePath) {
          await FoodPhotoUploadService.deleteFoodPhoto(uploadResult.storagePath);
        }
        
        onValidationComplete(true);
      } else {
        setValidationResults(prev => ({ 
          ...prev, 
          uploadTest: false,
          errorMessage: `Upload test failed: ${uploadResult.error}`
        }));
        onValidationComplete(false);
      }

    } catch (error) {
      console.error('Validation failed:', error);
      setValidationResults(prev => ({ 
        ...prev, 
        uploadTest: false,
        errorMessage: `Validation error: ${error.message}`
      }));
      onValidationComplete(false);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
    return status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Testing...';
    return status ? 'Passed' : 'Failed';
  };

  const isAllValid = validationResults.bucketAccess === true && validationResults.uploadTest === true;
  const hasFailures = validationResults.bucketAccess === false || validationResults.uploadTest === false;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          Photo Storage Validation
          {isValidating && <RefreshCw className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Storage Access:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(validationResults.bucketAccess)}
            <span className="text-sm">{getStatusText(validationResults.bucketAccess)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Upload Test:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(validationResults.uploadTest)}
            <span className="text-sm">{getStatusText(validationResults.uploadTest)}</span>
          </div>
        </div>

        {hasFailures && validationResults.errorMessage && (
          <Alert className="mt-3">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {validationResults.errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {isAllValid && (
          <Alert className="mt-3">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-sm text-green-700">
              Photo storage is working correctly. All images will be saved and accessible.
            </AlertDescription>
          </Alert>
        )}

        {hasFailures && (
          <Button 
            onClick={runValidation} 
            disabled={isValidating}
            variant="outline" 
            size="sm"
            className="w-full mt-2"
          >
            {isValidating ? 'Retesting...' : 'Retry Validation'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};