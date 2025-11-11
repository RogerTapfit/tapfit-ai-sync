import { Volume2 } from "lucide-react";
import { useAvatarSpeaking } from "@/hooks/useAvatarSpeaking";

export const SpeakingIndicator = () => {
  const { isSpeaking, avatarName } = useAvatarSpeaking();

  if (!isSpeaking) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-primary/90 backdrop-blur-sm text-primary-foreground px-6 py-3 rounded-full shadow-lg flex items-center gap-3">
        <Volume2 className="w-5 h-5 animate-pulse" />
        <span className="font-medium">
          {avatarName ? `${avatarName} is speaking...` : 'Coach is speaking...'}
        </span>
        <div className="flex gap-1">
          <span className="w-1 h-4 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1 h-4 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-1 h-4 bg-primary-foreground rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
