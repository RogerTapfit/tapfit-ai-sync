import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, AlertTriangle } from "lucide-react";
import { Capacitor } from "@capacitor/core";

export function RunGPSWarningBanner() {
  // Only show on web (not native iOS/Android)
  if (Capacitor.isNativePlatform()) return null;

  return (
    <Alert variant="default" className="mb-4 border-amber-500/50 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="text-sm">
        <strong className="text-amber-600 dark:text-amber-400">Limited GPS accuracy in browser.</strong>
        {" "}For best results with background tracking and accurate GPS data, install the TapFit native app on iOS.
        <br />
        <span className="text-xs text-muted-foreground mt-1 block">
          Browser tracking stops when screen locks or switching apps.
        </span>
      </AlertDescription>
    </Alert>
  );
}
