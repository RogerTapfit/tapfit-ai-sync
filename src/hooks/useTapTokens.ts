import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { isGuestMode } from '@/lib/utils';

interface TapTokenTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

export const useTapTokens = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<TapTokenTransaction[]>([]);
  const { toast } = useToast();

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBalance(0);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('tap_tokens_balance')
      .eq('id', user.id)
      .single();
    setBalance(data?.tap_tokens_balance || 0);
  };

  constconst fetchTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('tap_tokens_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setTransactions((data as any) || []);
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const spendTokens = async (amount: number, description: string) => {
    if (isGuestMode()) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to use Tap Tokens.',
        variant: 'destructive'
      });
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('spend_tap_tokens', {
      user_id: user.id,
      amount: amount,
      description: description
    });

    if (error) {
      toast({
        title: 'Transaction Failed',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    if (data) {
      setBalance(data);
      fetchTransactions(); // Refresh transactions after successful spend
      toast({
        title: 'Tokens Spent',
        description: `Spent ${amount} tokens: ${description}`,
      });
      return true;
    }

    console.log('Attempting to spend tokens', amount, description);
    return true;
  };

  return {
    balance,
    transactions,
    spendTokens
  };
};
