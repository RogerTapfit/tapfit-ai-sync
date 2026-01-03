import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Capacitor } from "@capacitor/core";

export function RunGPSWarningBanner() {
  // Only show on web (not native iOS/Android)
  if (Capacitor.isNativePlatform()) return null;

  return (
    <Alert variant="default" className="mb-4 border-muted-foreground/20 bg-muted/50">
      <Info className="h-4 w-4 text-muted-foreground" />
      <AlertDescription className="text-sm text-muted-foreground">
        <strong className="text-foreground">Tip:</strong> Keep your screen on during your session for continuous tracking.
      </AlertDescription>
    </Alert>
  );
}
