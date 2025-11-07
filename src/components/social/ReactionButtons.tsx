import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useActivityReactions, ReactionType, TargetType } from '@/hooks/useActivityReactions';

interface ReactionButtonsProps {
  targetType: TargetType;
  targetId: string;
  className?: string;
}

const reactionEmojis: Record<ReactionType, string> = {
  like: '👍',
  fire: '🔥',
  muscle: '💪',
  celebrate: '🎉'
};

export const ReactionButtons = ({ targetType, targetId, className }: ReactionButtonsProps) => {
  const { counts, userReactions, loading, toggleReaction } = useActivityReactions(targetType, targetId);

  if (loading) {
    return (
      <div className={cn("flex gap-1", className)}>
        {Object.keys(reactionEmojis).map((type) => (
          <div key={type} className="h-8 w-12 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-1 flex-wrap", className)}>
      {(Object.keys(reactionEmojis) as ReactionType[]).map((type) => {
        const isActive = userReactions.has(type);
        const count = counts[type];

        return (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            onClick={() => toggleReaction(type)}
            className={cn(
              "h-8 px-2 gap-1 transition-all hover:scale-110",
              isActive && "bg-primary/20 text-primary border border-primary/30"
            )}
          >
            <span className="text-base">{reactionEmojis[type]}</span>
            {count > 0 && (
              <span className={cn(
                "text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
};
