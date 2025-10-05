import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Download, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const LogoGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const generateLogo = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generateLogo');
      
      if (error) throw error;
      
      if (data?.imageUrl) {
        setLogoUrl(data.imageUrl);
        toast.success('Logo generated successfully!');
      } else {
        throw new Error('No image data received');
      }
    } catch (error) {
      console.error('Error generating logo:', error);
      toast.error('Failed to generate logo. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadLogo = () => {
    if (!logoUrl) return;
    
    const link = document.createElement('a');
    link.href = logoUrl;
    link.download = 'tapfit-logo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logo downloaded!');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          TapFit Logo Generator
        </CardTitle>
        <CardDescription>
          Generate a custom logo for TapFit using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={generateLogo}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Logo...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate TapFit Logo
            </>
          )}
        </Button>

        {logoUrl && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-center">
                <img 
                  src={logoUrl} 
                  alt="Generated TapFit Logo" 
                  className="max-w-full h-auto rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Favicon Preview:</p>
                <div className="border rounded p-4 bg-background flex items-center gap-2">
                  <img src={logoUrl} alt="Favicon" className="w-4 h-4" />
                  <span className="text-xs">TapFit</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Browser Tab Preview:</p>
                <div className="border rounded p-4 bg-background flex items-center gap-2">
                  <img src={logoUrl} alt="Tab Icon" className="w-8 h-8" />
                  <span className="text-sm">TapFit - AI-Powered Fitness</span>
                </div>
              </div>
            </div>

            <Button
              onClick={downloadLogo}
              variant="outline"
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Logo
            </Button>

            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Download the logo</li>
                <li>Convert to .ico format (or use PNG for modern browsers)</li>
                <li>Replace public/favicon.ico with the new logo</li>
                <li>Clear browser cache to see the new favicon</li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
