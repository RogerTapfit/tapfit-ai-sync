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
    setBalance((data as any)?.tap_tokens_balance || 0);
  };

  const fetchTransactions = async () => {
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

  // Flexible signature: (amount, description) OR (amount, transaction_type, description, referenceId?)
  const spendTokens = async (
    amount: number,
    tOrDesc: string,
    maybeDesc?: string,
    referenceId?: string
  ) => {
    if (isGuestMode()) {
      toast({ title: 'Sign in required', description: 'Please sign in to use Tap Tokens.', variant: 'destructive' });
      return false;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const transaction_type = typeof maybeDesc === 'string' ? tOrDesc : 'spend';
    const description = typeof maybeDesc === 'string' ? maybeDesc : tOrDesc;

    // Use add_tap_tokens with negative amount to represent spending
    const { error } = await supabase.rpc('add_tap_tokens', {
      _user_id: user.id,
      _amount: -Math.abs(amount),
      _transaction_type: transaction_type,
      _description: description,
      _reference_id: referenceId
    } as any);

    if (error) {
      toast({ title: 'Transaction Failed', description: error.message, variant: 'destructive' });
      return false;
    }

    await Promise.all([fetchBalance(), fetchTransactions()]);
    toast({ title: 'Tokens Spent', description: `Spent ${amount} tokens: ${description}` });
    return true;
  };

  return {
    balance,
    tokenBalance: balance,
    transactions,
    spendTokens
  };
};
