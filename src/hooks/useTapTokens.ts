import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface TapTokenTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export const useTapTokens = () => {
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [tokenTransactions, setTokenTransactions] = useState<TapTokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user's tap tokens balance
  const fetchTokenBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('tap_tokens_balance')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching token balance:', error);
      return;
    }

    setTokenBalance(data?.tap_tokens_balance || 0);
  };

  // Fetch token transaction history
  const fetchTokenTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tap_tokens_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching token transactions:', error);
      return;
    }

    setTokenTransactions(data || []);
  };

  // Award tap tokens
  const awardTokens = async (amount: number, type: string, description: string, referenceId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('add_tap_tokens', {
      _user_id: user.id,
      _amount: amount,
      _transaction_type: type,
      _description: description,
      _reference_id: referenceId || null
    });

    if (error) {
      console.error('Error awarding tokens:', error);
      return false;
    }

    if (data) {
      await fetchTokenBalance();
      await fetchTokenTransactions();
      toast({
        title: "TapTokens Earned! ⚡",
        description: `+${amount} tokens: ${description}`,
      });
      return true;
    }

    return false;
  };

  // Spend tap tokens
  const spendTokens = async (amount: number, type: string, description: string, referenceId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if user has enough tokens
    if (tokenBalance < amount) {
      toast({
        title: "Insufficient TapTokens",
        description: `You need ${amount - tokenBalance} more tokens for this purchase.`,
        variant: "destructive"
      });
      return false;
    }

    const { data: spendResult, error: spendError } = await supabase.rpc('spend_tap_tokens', {
      _user_id: user.id,
      _amount: amount,
      _transaction_type: type,
      _description: description,
      _reference_id: referenceId || null
    });

    if (spendError || !spendResult) {
      console.error('Error spending tokens:', spendError);
      toast({
        title: "Purchase Failed",
        description: "Unable to complete token purchase. Please try again.",
        variant: "destructive"
      });
      return false;
    }

    await fetchTokenBalance();
    await fetchTokenTransactions();

    toast({
      title: "Purchase Successful! ⚡",
      description: `Spent ${amount} TapTokens: ${description}`,
    });

    return true;
  };

  // Convert TapCoins to TapTokens (if needed)
  const convertCoinsToTokens = async (coinAmount: number) => {
    // Conversion rate: 10 TapCoins = 1 TapToken
    const tokenAmount = Math.floor(coinAmount / 10);
    
    if (tokenAmount === 0) {
      toast({
        title: "Conversion Failed",
        description: "You need at least 10 TapCoins to convert to 1 TapToken.",
        variant: "destructive"
      });
      return false;
    }

    // This would involve both spending coins and awarding tokens
    // Implementation would depend on business logic
    const success = await awardTokens(tokenAmount, 'conversion', `Converted ${coinAmount} coins to ${tokenAmount} tokens`);
    
    return success;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTokenBalance(),
        fetchTokenTransactions()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    tokenBalance,
    tokenTransactions,
    loading,
    awardTokens,
    spendTokens,
    convertCoinsToTokens,
    refreshTokenData: () => Promise.all([fetchTokenBalance(), fetchTokenTransactions()])
  };
};