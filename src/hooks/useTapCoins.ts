import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { isGuestMode } from '@/lib/utils';

interface TapCoinsTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export const useTapCoins = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<TapCoinsTransaction[]>([]);
  const { toast } = useToast();

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBalance(0);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('tap_coins_balance')
      .eq('id', user.id)
      .single();
    setBalance(data?.tap_coins_balance || 0);
  };

  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('tap_coins_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTransactions((data as any) || []);
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const purchaseItem = async (storeItemId: string) => {
    if (isGuestMode()) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to purchase items.',
        variant: 'destructive'
      });
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: storeItem } = await supabase
      .from('store_items')
      .select('coin_cost')
      .eq('id', storeItemId)
      .single();

    if (!storeItem) {
      toast({
        title: 'Error',
        description: 'Store item not found.',
        variant: 'destructive'
      });
      return false;
    }

    if (balance < storeItem.coin_cost) {
      toast({
        title: 'Insufficient funds',
        description: 'You do not have enough Tap Coins to purchase this item.',
        variant: 'destructive'
      });
      return false;
    }

    const { error } = await supabase.rpc('spend_coins', {
      user_id: user.id,
      item_id: storeItemId,
      amount: storeItem.coin_cost,
      description: `Purchase of ${storeItemId}`
    });

    if (error) {
      toast({
        title: 'Purchase failed',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    toast({
      title: 'Item purchased',
      description: 'Thank you for your purchase!',
    });

    fetchBalance();
    fetchTransactions();
    console.log('Attempting to purchase item', storeItemId);
    return true;
  };

  const hasPurchased = (name: string) => {
    if (isGuestMode()) {
      return false;
    }

    const purchased = false;
    return purchased;
  };

  return {
    balance,
    transactions,
    purchaseItem,
    hasPurchased
  };
};
