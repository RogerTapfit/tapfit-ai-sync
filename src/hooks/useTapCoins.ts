import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

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
  description: string;
  coin_cost: number;
  category: string;
  image_url?: string;
}

interface UserPurchase {
  id: string;
  store_item_id: string;
  coins_spent: number;
  purchased_at: string;
  store_items: StoreItem;
}

export const useTapCoins = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<TapCoinsTransaction[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user's tap coins balance
  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('tap_coins_balance')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching balance:', error);
      return;
    }

    setBalance(data?.tap_coins_balance || 0);
  };

  // Fetch transaction history
  const fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tap_coins_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching transactions:', error);
      return;
    }

    setTransactions(data || []);
  };

  // Fetch store items
  const fetchStoreItems = async () => {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .eq('is_active', true)
      .order('coin_cost');

    if (error) {
      console.error('Error fetching store items:', error);
      return;
    }

    setStoreItems(data || []);
  };

  // Fetch user purchases
  const fetchPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_purchases')
      .select(`
        *,
        store_items (*)
      `)
      .eq('user_id', user.id)
      .order('purchased_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      return;
    }

    setPurchases(data || []);
  };

  // Award tap coins
  const awardCoins = async (amount: number, type: string, description: string, referenceId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('add_tap_coins', {
      _user_id: user.id,
      _amount: amount,
      _transaction_type: type,
      _description: description,
      _reference_id: referenceId || null
    });

    if (error) {
      console.error('Error awarding coins:', error);
      return false;
    }

    if (data) {
      await fetchBalance();
      await fetchTransactions();
      toast({
        title: "Tap Coins Earned! 🪙",
        description: `+${amount} coins: ${description}`,
      });
      return true;
    }

    return false;
  };

  // Purchase store item
  const purchaseItem = async (itemId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const item = storeItems.find(i => i.id === itemId);
    if (!item) return false;

    // Check if user has enough coins
    if (balance < item.coin_cost) {
      toast({
        title: "Insufficient Coins",
        description: `You need ${item.coin_cost - balance} more coins for this item.`,
        variant: "destructive"
      });
      return false;
    }

    // Spend coins
    const { data: spendResult, error: spendError } = await supabase.rpc('spend_tap_coins', {
      _user_id: user.id,
      _amount: item.coin_cost,
      _transaction_type: 'spend_item',
      _description: `Purchased ${item.name}`,
      _reference_id: item.id
    });

    if (spendError || !spendResult) {
      console.error('Error spending coins:', spendError);
      toast({
        title: "Purchase Failed",
        description: "Unable to complete purchase. Please try again.",
        variant: "destructive"
      });
      return false;
    }

    // Record purchase
    const { error: purchaseError } = await supabase
      .from('user_purchases')
      .insert({
        user_id: user.id,
        store_item_id: item.id,
        coins_spent: item.coin_cost
      });

    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
      return false;
    }

    await fetchBalance();
    await fetchTransactions();
    await fetchPurchases();

    toast({
      title: "Purchase Successful! 🎉",
      description: `You bought ${item.name} for ${item.coin_cost} coins.`,
    });

    return true;
  };

  // Check if user has purchased an item
  const hasPurchased = (itemId: string) => {
    return purchases.some(p => p.store_item_id === itemId);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchBalance(),
        fetchTransactions(),
        fetchStoreItems(),
        fetchPurchases()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    balance,
    transactions,
    storeItems,
    purchases,
    loading,
    awardCoins,
    purchaseItem,
    hasPurchased,
    refreshData: () => Promise.all([fetchBalance(), fetchTransactions(), fetchPurchases()])
  };
};