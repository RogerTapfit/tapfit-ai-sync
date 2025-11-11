import { Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useVoiceVolume } from "@/hooks/useVoiceVolume";

export const VoiceVolumeControl = () => {
  const { volume, setVolume } = useVoiceVolume();

  return (
    <div className="flex items-center gap-3 w-full max-w-xs">
      {volume === 0 ? (
        <VolumeX className="w-5 h-5 text-muted-foreground" />
      ) : (
        <Volume2 className="w-5 h-5 text-muted-foreground" />
      )}
      <Slider
        value={[volume * 100]}
        onValueChange={(values) => setVolume(values[0] / 100)}
        max={100}
        step={1}
        className="flex-1"
      />
      <span className="text-sm text-muted-foreground w-10 text-right">
        {Math.round(volume * 100)}%
      </span>
    </div>
  );
};
