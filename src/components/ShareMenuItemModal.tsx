import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, QrCode, Check, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";

interface MenuItem {
  name: string;
  calories?: number;
  price?: number;
  description?: string;
  dietaryTags?: string[];
  healthScore?: number;
  macros?: {
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

interface ShareMenuItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: MenuItem | null;
  comparisonItems?: MenuItem[];
  restaurantName?: string;
  type: 'item' | 'comparison';
}

export const ShareMenuItemModal = ({
  open,
  onOpenChange,
  item,
  comparisonItems,
  restaurantName,
  type
}: ShareMenuItemModalProps) => {
  const [shareUrl, setShareUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [expiryDays, setExpiryDays] = useState<string>('7');

  const generateShareLink = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Please sign in to share items');
        setGenerating(false);
        return;
      }

      const payload = type === 'item' ? {
        action: 'create',
        type: 'item',
        data: {
          itemName: item?.name,
          itemData: item,
          restaurantName,
          expiresInDays: expiryDays ? parseInt(expiryDays) : null
        }
      } : {
        action: 'create',
        type: 'comparison',
        data: {
          comparisonData: comparisonItems,
          restaurantName,
          expiresInDays: expiryDays ? parseInt(expiryDays) : null
        }
      };

      const { data, error } = await supabase.functions.invoke('shareMenuItem', {
        body: payload
      });

      if (error) throw error;

      setShareUrl(data.shareUrl);
      toast.success('Share link created!');
    } catch (error) {
      console.error('Error generating share link:', error);
      toast.error('Failed to generate share link');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {type === 'item' ? 'Menu Item' : 'Comparison'}
          </DialogTitle>
          <DialogDescription>
            {type === 'item' 
              ? `Share "${item?.name}" with friends`
              : 'Share this comparison with friends'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!shareUrl ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="expiry">Link expires in (days)</Label>
                <Input
                  id="expiry"
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  placeholder="7"
                  min="1"
                  max="365"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for permanent link
                </p>
              </div>

              <Button 
                onClick={generateShareLink} 
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Generate Share Link
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input 
                    value={shareUrl} 
                    readOnly 
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowQR(!showQR)}
                className="w-full"
              >
                <QrCode className="h-4 w-4 mr-2" />
                {showQR ? 'Hide' : 'Show'} QR Code
              </Button>

              {showQR && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={shareUrl} size={200} />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShareUrl('');
                    setShowQR(false);
                  }}
                  className="flex-1"
                >
                  Create New
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};