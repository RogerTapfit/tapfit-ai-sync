import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useTapTokens } from './useTapTokens';

interface LootBox {
  id: string;
  name: string;
  description?: string;
  tap_token_cost: number;
  rarity_tier: string;
  guaranteed_rewards: any[];
  possible_rewards: any[];
  is_active: boolean;
  created_at: string;
}

interface LootBoxOpening {
  id: string;
  loot_box_id: string;
  rewards_received: any[];
  tokens_spent: number;
  opened_at: string;
}

interface LootBoxReward {
  type: 'chassis' | 'tech_module' | 'color_scheme' | 'power_up' | 'tokens' | 'coins';
  name: string;
  value: string | number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  description?: string;
}

export const useLootBoxes = () => {
  const [lootBoxes, setLootBoxes] = useState<LootBox[]>([]);
  const [userOpenings, setUserOpenings] = useState<LootBoxOpening[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const { toast } = useToast();
  const { tokenBalance, spendTokens } = useTapTokens();

  // Fetch available loot boxes
  const fetchLootBoxes = async () => {
    const { data, error } = await supabase
      .from('loot_boxes')
      .select('*')
      .eq('is_active', true)
      .order('tap_token_cost');

    if (error) {
      console.error('Error fetching loot boxes:', error);
      return;
    }

    setLootBoxes((data as any[]) || []);
  };

  // Fetch user's loot box openings
  const fetchUserOpenings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_loot_openings')
      .select('*')
      .eq('user_id', user.id)
      .order('opened_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching user openings:', error);
      return;
    }

    setUserOpenings((data as any[]) || []);
  };

  // Generate random rewards based on loot box configuration
  const generateRewards = (lootBox: LootBox): LootBoxReward[] => {
    const rewards: LootBoxReward[] = [];

    // Add guaranteed rewards
    rewards.push(...lootBox.guaranteed_rewards);

    // Generate random rewards from possible rewards
    const numberOfRandomRewards = Math.floor(Math.random() * 3) + 1; // 1-3 random rewards
    
    for (let i = 0; i < numberOfRandomRewards; i++) {
      if (lootBox.possible_rewards.length > 0) {
        const randomIndex = Math.floor(Math.random() * lootBox.possible_rewards.length);
        const randomReward = lootBox.possible_rewards[randomIndex];
        
        // Apply rarity-based probability
        const rarityChance = Math.random();
        let selectedRarity: string;
        
        if (rarityChance < 0.6) selectedRarity = 'common';
        else if (rarityChance < 0.85) selectedRarity = 'rare';
        else if (rarityChance < 0.97) selectedRarity = 'epic';
        else selectedRarity = 'legendary';

        rewards.push({
          ...randomReward,
          rarity: selectedRarity as any
        });
      }
    }

    return rewards;
  };

  // Open a loot box
  const openLootBox = async (lootBoxId: string): Promise<LootBoxReward[] | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const lootBox = lootBoxes.find(box => box.id === lootBoxId);
    if (!lootBox) {
      toast({
        title: "Loot Box Not Found",
        description: "The selected loot box is no longer available.",
        variant: "destructive"
      });
      return null;
    }

    // Check if user has enough tokens
    if (tokenBalance < lootBox.tap_token_cost) {
      toast({
        title: "Insufficient TapTokens",
        description: `You need ${lootBox.tap_token_cost - tokenBalance} more TapTokens to open this loot box.`,
        variant: "destructive"
      });
      return null;
    }

    setOpening(true);

    try {
      // Spend tokens
      const spendSuccess = await spendTokens(
        lootBox.tap_token_cost,
        'loot_box',
        `Opened ${lootBox.name}`,
        lootBoxId
      );

      if (!spendSuccess) {
        throw new Error('Failed to spend tokens');
      }

      // Generate rewards
      const rewards = generateRewards(lootBox);

      // Record the opening
      const { error: openingError } = await supabase
        .from('user_loot_openings')
        .insert({
          user_id: user.id,
          loot_box_id: lootBoxId,
          rewards_received: rewards as any,
          tokens_spent: lootBox.tap_token_cost
        });

      if (openingError) {
        console.error('Error recording loot box opening:', openingError);
        throw openingError;
      }

      await fetchUserOpenings();

      toast({
        title: `${lootBox.name} Opened! 🎁`,
        description: `You received ${rewards.length} rewards!`,
      });

      return rewards;
    } catch (error) {
      console.error('Error opening loot box:', error);
      toast({
        title: "Opening Failed",
        description: "Unable to open loot box. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setOpening(false);
    }
  };

  // Get loot box by ID
  const getLootBoxById = (id: string) => {
    return lootBoxes.find(box => box.id === id);
  };

  // Check how many times user has opened a specific loot box
  const getUserOpeningCount = (lootBoxId: string) => {
    return userOpenings.filter(opening => opening.loot_box_id === lootBoxId).length;
  };

  // Get all rewards user has received
  const getAllUserRewards = (): LootBoxReward[] => {
    const allRewards: LootBoxReward[] = [];
    userOpenings.forEach(opening => {
      allRewards.push(...opening.rewards_received);
    });
    return allRewards;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchLootBoxes(),
        fetchUserOpenings()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    lootBoxes,
    userOpenings,
    loading,
    opening,
    openLootBox,
    getLootBoxById,
    getUserOpeningCount,
    getAllUserRewards,
    refreshData: () => Promise.all([fetchLootBoxes(), fetchUserOpenings()])
  };
};