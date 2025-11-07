import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type ReactionType = 'like' | 'fire' | 'muscle' | 'celebrate';
export type TargetType = 'workout' | 'achievement' | 'pr';

export interface Reaction {
  id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface ReactionCounts {
  like: number;
  fire: number;
  muscle: number;
  celebrate: number;
}

export const useActivityReactions = (targetType: TargetType, targetId: string) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [userReactions, setUserReactions] = useState<Set<ReactionType>>(new Set());
  const [counts, setCounts] = useState<ReactionCounts>({
    like: 0,
    fire: 0,
    muscle: 0,
    celebrate: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from('activity_reactions' as any)
      .select('*')
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) {
      console.error('Error fetching reactions:', error);
      return;
    }

    const reactions = (data || []) as unknown as Reaction[];
    setReactions(reactions);
    
    // Calculate counts
    const newCounts: ReactionCounts = {
      like: 0,
      fire: 0,
      muscle: 0,
      celebrate: 0
    };
    
    const { data: { user } } = await supabase.auth.getUser();
    const userReactionTypes = new Set<ReactionType>();

    reactions.forEach(reaction => {
      newCounts[reaction.reaction_type as ReactionType]++;
      if (user && reaction.user_id === user.id) {
        userReactionTypes.add(reaction.reaction_type as ReactionType);
      }
    });

    setCounts(newCounts);
    setUserReactions(userReactionTypes);
  };

  useEffect(() => {
    const loadReactions = async () => {
      setLoading(true);
      await fetchReactions();
      setLoading(false);
    };

    loadReactions();
  }, [targetType, targetId]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`reactions-${targetType}-${targetId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_reactions',
          filter: `target_type=eq.${targetType},target_id=eq.${targetId}`
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetType, targetId]);

  const toggleReaction = async (reactionType: ReactionType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to react to activities",
        variant: "destructive"
      });
      return;
    }

    const hasReaction = userReactions.has(reactionType);

    if (hasReaction) {
      // Remove reaction
      const { error } = await supabase
        .from('activity_reactions' as any)
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .eq('reaction_type', reactionType);

      if (error) {
        console.error('Error removing reaction:', error);
        toast({
          title: "Error",
          description: "Failed to remove reaction",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Add reaction
      const { error } = await supabase
        .from('activity_reactions' as any)
        .insert({
          user_id: user.id,
          target_type: targetType,
          target_id: targetId,
          reaction_type: reactionType
        });

      if (error) {
        console.error('Error adding reaction:', error);
        toast({
          title: "Error",
          description: "Failed to add reaction",
          variant: "destructive"
        });
        return;
      }
    }

    // Optimistically update UI
    const newUserReactions = new Set(userReactions);
    if (hasReaction) {
      newUserReactions.delete(reactionType);
    } else {
      newUserReactions.add(reactionType);
    }
    setUserReactions(newUserReactions);

    const newCounts = { ...counts };
    newCounts[reactionType] += hasReaction ? -1 : 1;
    setCounts(newCounts);
  };

  return {
    reactions,
    counts,
    userReactions,
    loading,
    toggleReaction
  };
};
