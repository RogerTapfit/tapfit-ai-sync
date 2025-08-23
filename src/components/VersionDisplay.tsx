import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Copy, CheckCircle, Zap } from "lucide-react";
import { getVersionInfo, getVersionString } from "@/lib/version";
import { FirmwareManager } from "@/lib/firmwareRegistry";
import { useToast } from "@/hooks/use-toast";

interface VersionDisplayProps {
  variant?: 'badge' | 'card' | 'minimal';
  showCopy?: boolean;
}

export const VersionDisplay = ({ variant = 'badge', showCopy = false }: VersionDisplayProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const versionInfo = getVersionInfo();
  const fullVersionString = getVersionString();
  const currentFirmware = FirmwareManager.getCurrentFirmware();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullVersionString);
      setCopied(true);
      toast({
        title: "Version copied",
        description: "Version information copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy version information",
        variant: "destructive",
      });
    }
  };

  if (variant === 'minimal') {
    return (
      <span className="text-xs text-muted-foreground font-mono">
        {versionInfo.version}
      </span>
    );
  }

  if (variant === 'badge') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="font-mono text-xs">
          v{versionInfo.version}
        </Badge>
        <Badge variant="secondary" className="font-mono text-xs flex items-center gap-1">
          <Zap className="h-3 w-3" />
          FW v{currentFirmware.version}
        </Badge>
        {showCopy && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="p-4 glow-card">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 mb-2">
          <Info className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">App Version</h3>
        </div>
        {showCopy && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
          >
            {copied ? (
              <CheckCircle className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Version:</span>
          <span className="font-mono">{versionInfo.version}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Platform:</span>
          <span className="font-mono uppercase">{versionInfo.platform}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Build:</span>
          <span className="font-mono text-xs">{versionInfo.buildNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date:</span>
          <span className="font-mono text-xs">{versionInfo.buildDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Firmware:</span>
          <span className="font-mono text-xs">v{currentFirmware.version}</span>
        </div>
      </div>
    </Card>
  );
};