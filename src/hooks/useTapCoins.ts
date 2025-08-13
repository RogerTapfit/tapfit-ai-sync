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

interface StoreItem {
  id: string;
  name: string;
  category: string;
  coin_cost: number;
  description: string | null;
  image_url?: string | null;
  is_active: boolean;
}

interface Purchase {
  id: string;
  purchased_at: string;
  coins_spent: number;
  store_items: { id: string; name: string };
}

export const useTapCoins = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<TapCoinsTransaction[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
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
    setBalance((data as any)?.tap_coins_balance || 0);
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

  const fetchStoreItems = async () => {
    const { data, error } = await supabase
      .from('store_items')
      .select('id, name, category, coin_cost, description, image_url, is_active')
      .eq('is_active', true)
      .order('coin_cost', { ascending: true });
    if (!error) setStoreItems((data as any) || []);
  };

  const fetchPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('user_purchases')
      .select('id, purchased_at, coins_spent, store_items(id, name)')
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false });
    if (!error) setPurchases((data as any) || []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        fetchBalance(),
        fetchTransactions(),
        fetchStoreItems(),
        fetchPurchases(),
      ]);
      setLoading(false);
    })();
  }, []);

  const awardCoins = async (
    amount: number,
    transactionType: string,
    description?: string,
    referenceId?: string
  ) => {
    if (isGuestMode()) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to earn Tap Coins.',
        variant: 'destructive'
      });
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.rpc('add_tap_coins', {
      _user_id: user.id,
      _amount: amount,
      _transaction_type: transactionType,
      _description: description || '',
      _reference_id: referenceId
    } as any);

    if (error) {
      console.error('Award coins failed:', error);
      toast({ title: 'Transaction Failed', description: error.message, variant: 'destructive' });
      return false;
    }

    await Promise.all([fetchBalance(), fetchTransactions()]);
    return true;
  };

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
      .select('coin_cost, name')
      .eq('id', storeItemId)
      .single();

    if (!storeItem) {
      toast({ title: 'Error', description: 'Store item not found.', variant: 'destructive' });
      return false;
    }

    if (balance < (storeItem as any).coin_cost) {
      toast({ title: 'Insufficient funds', description: 'Not enough Tap Coins.', variant: 'destructive' });
      return false;
    }

    // Deduct coins (negative amount)
    const { error: spendError } = await supabase.rpc('add_tap_coins', {
      _user_id: user.id,
      _amount: -Math.abs((storeItem as any).coin_cost),
      _transaction_type: 'purchase',
      _description: `Purchase of ${(storeItem as any).name}`,
      _reference_id: storeItemId
    } as any);

    if (spendError) {
      toast({ title: 'Purchase failed', description: spendError.message, variant: 'destructive' });
      return false;
    }

    // Record purchase
    const { error: purchaseError } = await supabase
      .from('user_purchases')
      .insert({
        user_id: user.id,
        store_item_id: storeItemId,
        coins_spent: (storeItem as any).coin_cost
      } as any);

    if (purchaseError) {
      console.error('Failed to record purchase:', purchaseError);
    }

    toast({ title: 'Item purchased', description: 'Thank you for your purchase!' });

    await Promise.all([fetchBalance(), fetchTransactions(), fetchPurchases()]);
    return true;
  };

  const hasPurchased = (storeItemId: string) => {
    if (!purchases || purchases.length === 0) return false;
    return purchases.some((p) => p.store_items?.id === storeItemId);
  };

  return {
    loading,
    balance,
    transactions,
    storeItems,
    purchases,
    purchaseItem,
    hasPurchased,
    awardCoins,
  };
};
